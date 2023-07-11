// init my data
const playerName = getParam("player")??"";
const myPlayerId = getParam("playerId")??"";
let playerPosition = 0;
const roomKey = getParam("room")??"";

// websocket
const uri = new URL(window.location.href);
const port = ""
const websocketEndpoint = "/ws"
const wsParameter = "?session="+roomKey+"&player="+playerName+"&id="+myPlayerId;
const socket = new WebSocket('wss://' + uri.hostname + port + websocketEndpoint+wsParameter);

// rest
const restApiUrl = "https://" + uri.hostname+ port;
const restApiEndpoint = "/game/answerer";
const restApiUrlAnswerer = restApiUrl + restApiEndpoint;

// global variables
// game data
let maxPlayer = 0;
let players = [];
let question = "お待ちください";
// view data
const defaultWidth = 400;
const defaultHeight = 300;
const penColor = "255, 255, 255, 1";
const penBold = 5;
let clicking = 0;

socket.addEventListener("error", (event) => {
    const data = event.data;
    console.log('WS: error: ', event);
    alert("サーバーに接続できませんでした。管理者にアクセスしているURLを連絡してください。");
})

socket.addEventListener("open", (event) => {
    console.log('WS: opened.');
})

socket.addEventListener("close", (event) => {
    alert("接続が切れました。画面を更新してください。");
})

socket.addEventListener("message", (event) => {
    console.log('WS: message received.');
    const data = event.data;
    let response = JSON.parse(data);
    if (response.destination != undefined && response.destination === "player") {
        const dataType = response.type;
        const body = response.body;
        switch (dataType) {
            case "init":
                for (const player of body.players) {
                    if (player.id === myPlayerId) {
                        playerPosition = player.position;
                        initMyData(playerName, player.position);
                        break;
                    }
                }
                maxPlayer = body.maxPlayers;
                initPlayers(body.players);
                initAnswers();
                initQuestion(question);
                disableAnswerButton();
                break;
            case "players":
                renderPlayersArea(body);
                break;
            case "question":
                renderQuestion(body);
                initAnswers();
                initMyAnswerText();
                enableAnswerButton();
                break;
            case "judge":
                renderAnswers(body.judges);
                break;
            default:
                break;
        }
    }
})

function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function sendAnswer() {
    const answer = document.getElementById('answer_text');
    const answerVal = answer.value;
    console.log(answerVal);

    const answerData = {
        id: myPlayerId,
        answer: answerVal,
    }
    var answerJson = JSON.stringify(answerData);
    const XHR = new XMLHttpRequest();
    XHR.open('POST', restApiUrlAnswerer + "/answer");
    XHR.setRequestHeader('Content-Type', 'application/json');
    XHR.send(answerJson);

    disableAnswerButton();
}

function initMyData(name, pos) {
    const player = document.getElementById('player_name');
    player.innerText = name;

    const position = document.getElementById('position');
    position.innerText = pos;
}

function renderPlayersArea(p) {
    players = p;
    const other_answer_name = document.getElementsByClassName('other_answer_name');
    for (let index = 0; index < maxPlayer; index++) {
        other_answer_name[index].innerText = "未参加";
    }
    for (let index = 0; index < maxPlayer; index++) {
        if (undefined !== players[index]) {
            other_answer_name[players[index].position-1].innerText = players[index].name;
            other_answer_name[players[index].position-1].id = players[index].id;
        }
    }
}

function initPlayers(players) {
    renderPlayersArea(players);
}

function renderQuestion(body) {
    if (body.playerId != undefined && body.playerId == myPlayerId){
        const qc = document.getElementById('question');
        qc.innerText = body.question;
    }
}

function initQuestion(question) {
    renderQuestion(question);
}

function renderAnswers(answers) {
    console.log(players);
    const other_answer_text = document.getElementsByClassName('other_answer_text');
    for (let index = 0; index < maxPlayer; index++) {
        other_answer_text[index].innerText = "";
    }
    for (let index = 0; index < maxPlayer; index++) {
        for (let i = 0; i < answers.length; i++) {
            if (undefined !== players[index]) {
                if (other_answer_text[players[index].position-1].id === answers[i].id) {
                    other_answer_text[players[index].position-1].innerText = answers[i].answer;
                    if (answers[i].result === true) {
                        other_answer_text[players[index].position-1].style.backgroundColor  = '#ff0000';
                    } else {
                        other_answer_text[players[index].position-1].style.backgroundColor  = '#0000ff';
                    }
                    break;
                }    
            }
        }
    }
}

function initAnswers() {
    const other_answer_text = document.getElementsByClassName('other_answer_text');
    for (let index = 0; index < maxPlayer; index++) {
        other_answer_text[index].innerText = "";
        other_answer_text[index].style.backgroundColor  = '#0000ff';
    }
    for (let index = 0; index < maxPlayer; index++) {
        for (let i = 0; i < players.length; i++) {
            if (undefined !== players[i]) {
                other_answer_text[players[i].position-1].id = players[i].id;
            }
        }
    }
}

function disableAnswerButton() {
    const answerButton = document.getElementById("send_answer");
    answerButton.disabled = true;
}

function enableAnswerButton() {
    const answerButton = document.getElementById("send_answer");
    answerButton.disabled = false;
}

function initMyAnswerText() {
    const answerText = document.getElementById("answer_text");
    answerText.value = "";
}
