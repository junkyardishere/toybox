package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"text/template"
	"time"

	"github.com/go-playground/validator"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

var (
	upgrader         = websocket.Upgrader{}
	clients          = make(map[*websocket.Conn]bool)
	broadcast        = make(chan Message)
	session          *Session
	joinedSession    *JoindSession
	keepAliveStarted = false
)

type Message struct {
	Destination string      `json:"destination"`
	Type        string      `json:"type"`
	Body        interface{} `json:"body"`
}

type CustomValidator struct {
	validator *validator.Validate
}

type Session struct {
	SessionId  string    `json:"sessionId" validate:"required"`
	MaxPlayers int       `json:"maxPlayers" validate:"required"`
	Players    *[]Player `json:"players" validate:"required"`
}

type JoindSession struct {
	SessionId  string    `json:"sessionId" validate:"required"`
	MaxPlayers int       `json:"maxPlayers" validate:"required"`
	Players    *[]Player `json:"players" validate:"required"`
}

type Player struct {
	Id       string `json:"id" validate:"required"`
	Name     string `json:"name" validate:"required"`
	Position int    `json:"position" validate:"required"`
}

type Question struct {
	Type     string `json:"type" validate:"required"`
	Question string `json:"question" validate:"required"`
}

type Answer struct {
	Id     string `json:"id" validate:"required"`
	Answer string `json:"answer" validate:"required"`
}

type Judges struct {
	Judge *[]Judge `json:"judges" validate:"required"`
}

type Judge struct {
	Id     string `json:"id" validate:"required"`
	Name   string `json:"name"`
	Answer string `json:"answer"`
	Result bool   `json:"result" validate:"required"`
}

type DefaultResponse struct {
	Result string `json:"result"`
}

type TemplateRender struct {
	templates *template.Template
}

func (t *TemplateRender) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Validator = &CustomValidator{validator: validator.New()}
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPut, http.MethodPost, http.MethodDelete},
	}))
	port := os.Getenv("PORT")
	if port == "" {
		port = "5656"
	}

	// html
	renderer := &TemplateRender{
		templates: template.Must(template.ParseGlob("view/*.html")),
	}
	e.Renderer = renderer
	e.Static("/view/js/", "./view/js/")
	e.Static("/view/css/", "./view/css/")
	e.GET("/view/answerer", func(c echo.Context) error {
		return c.Render(http.StatusOK, "answerer.html", "")
	})
	e.GET("/view/questioner", func(c echo.Context) error {
		return c.Render(http.StatusOK, "questioner.html", "")
	})
	e.GET("/view/spectator", func(c echo.Context) error {
		return c.Render(http.StatusOK, "spectator.html", "")
	})
	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, DefaultResponse{Result: "ok"})
	})

	// sender
	// // answerer
	game := e.Group("/game")
	answerer := game.Group("/answerer")
	answerer.POST("/answer", sendAnswer)

	// // questioner
	questioner := game.Group("/questioner")
	questioner.POST("/question/register", createSession)
	questioner.POST("/question/editSession", editSession)
	questioner.POST("/question/send", sendQuestion)
	questioner.POST("/question/judge", sendJudge)
	questioner.POST("/resetAll", resetAll)

	// ws
	e.GET("/ws", subscribe)
	e.GET("/ws/spectate", subscribeForSpectator)
	go handleMessages()
	go keepAlive()
	e.Logger.Fatal(e.Start(":" + port))
}

func empty(c echo.Context) (err error) {
	return nil
}

func sendAnswer(c echo.Context) (err error) {
	req := new(Answer)
	if err = c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err = c.Validate(req); err != nil {
		return err
	}

	broadcastMessageToQuestioner("answer", req)
	return c.JSON(http.StatusOK, req)
}

func createSession(c echo.Context) (err error) {
	req := new(Session)
	if err = c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err = c.Validate(req); err != nil {
		return err
	}
	session = req
	return c.JSON(http.StatusOK, req)
}

func editSession(c echo.Context) (err error) {
	req := new(Session)
	if err = c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err = c.Validate(req); err != nil {
		return err
	}
	session = req
	broadcastMessageToPlayers("editSession", req)
	return c.JSON(http.StatusOK, req)
}

func sendQuestion(c echo.Context) (err error) {
	req := new(Question)
	if err = c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err = c.Validate(req); err != nil {
		return err
	}

	broadcastMessageToPlayers("question", req)
	return c.JSON(http.StatusOK, req)
}

func sendJudge(c echo.Context) (err error) {
	req := new(Judges)
	if err = c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err = c.Validate(req); err != nil {
		return err
	}

	broadcastMessageToPlayers("judge", req)
	return c.JSON(http.StatusOK, req)
}

func resetAll(c echo.Context) (err error) {
	session = nil
	joinedSession = nil
	for client := range clients {
		client.Close()
		delete(clients, client)
	}
	return c.JSON(http.StatusOK, DefaultResponse{Result: "reset done"})
}

func subscribe(c echo.Context) (err error) {
	sessionId := c.QueryParam("session")
	playerId := c.QueryParam("id")
	reqPlayerName := c.QueryParam("player")

	if session == nil || session.SessionId != sessionId {
		err = fmt.Errorf("no game found")
		return c.JSON(http.StatusBadRequest, DefaultResponse{Result: err.Error()})
	}

	playerCheck := false
	playerPosition := 0
	playerName := ""
	for _, player := range *session.Players {
		if player.Id == playerId {
			playerCheck = true
			playerPosition = player.Position
			playerName = player.Name
		}
	}
	if playerCheck == false {
		err = fmt.Errorf("player not found")
		return c.JSON(http.StatusBadRequest, DefaultResponse{Result: err.Error()})
	}

	if reqPlayerName == "" || reqPlayerName != playerName {
		err = fmt.Errorf("player name no match")
		return c.JSON(http.StatusBadRequest, DefaultResponse{Result: err.Error()})
	}

	if joinedSession == nil {
		pl := make([]Player, 0)
		joinedSession = &JoindSession{
			SessionId:  sessionId,
			MaxPlayers: session.MaxPlayers,
			Players:    &pl,
		}
	}
	for _, joinedPlayer := range *joinedSession.Players {
		if joinedPlayer.Id == playerId {
			err = fmt.Errorf("player already joined")
			return c.JSON(http.StatusBadRequest, DefaultResponse{Result: err.Error()})
		}
	}

	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}
	defer func() {
		ps := make([]Player, 0)
		for _, player := range *joinedSession.Players {
			if player.Id != playerId {
				ps = append(ps, player)
			}
		}
		*joinedSession.Players = ps
		broadcastMessageToPlayers("players", *joinedSession.Players)

		delete(clients, ws)
		ws.Close()
	}()
	clients[ws] = true

	p := &Player{
		Id:       playerId,
		Name:     playerName,
		Position: playerPosition,
	}
	*joinedSession.Players = append(*joinedSession.Players, *p)

	broadcastMessageToPlayers("init", *joinedSession)
	for {
		var message Message
		err := ws.ReadJSON(&message)
		if err != nil {
			fmt.Println(err)
			delete(clients, ws)
			break
		}
	}
	return
}

func subscribeForSpectator(c echo.Context) (err error) {
	sessionId := c.QueryParam("session")
	if session == nil || session.SessionId != sessionId {
		err = fmt.Errorf("no game found")
		return c.JSON(http.StatusBadRequest, DefaultResponse{Result: err.Error()})
	}
	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}
	defer func() {
		delete(clients, ws)
		ws.Close()
	}()
	clients[ws] = true
	if joinedSession == nil {
		pl := make([]Player, 0)
		joinedSession = &JoindSession{
			SessionId:  sessionId,
			MaxPlayers: session.MaxPlayers,
			Players:    &pl,
		}
	}
	broadcastMessageToPlayers("init", *joinedSession)
	for {
		var message Message
		err := ws.ReadJSON(&message)
		if err != nil {
			fmt.Println(err)
			delete(clients, ws)
			break
		}
	}
	return
}

func handleMessages() {
	for {
		message := <-broadcast
		for client := range clients {
			err := client.WriteJSON(message)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

func keepAlive() {
	for {
		time.Sleep(time.Second * 10)
		broadcastMessageToEveryone("keepAlive", DefaultResponse{Result: "ok"})
	}
}

func (cv *CustomValidator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, DefaultResponse{Result: err.Error()})
	}
	return nil
}

func broadcastMessageToPlayers(messageType string, body interface{}) {
	m := Message{
		Destination: "player",
		Type:        messageType,
		Body:        body,
	}
	broadcast <- m
}

func broadcastMessageToQuestioner(messageType string, body interface{}) {
	m := Message{
		Destination: "questioner",
		Type:        messageType,
		Body:        body,
	}
	broadcast <- m
}

func broadcastMessageToEveryone(messageType string, body interface{}) {
	m := Message{
		Destination: "everyone",
		Type:        messageType,
		Body:        body,
	}
	broadcast <- m
}
