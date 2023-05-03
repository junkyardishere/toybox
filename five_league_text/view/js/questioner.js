// init my data
const roomKey = getParam("room")??"";

// websocket
const uri = new URL(window.location.href);
const port = ":5656"
const websocketEndpoint = "/ws/spectate"
const wsParameter = "?session="+roomKey;
const socket = new WebSocket('ws://' + uri.hostname + port + websocketEndpoint + wsParameter);

// rest
const restApiUrl = "http://" + uri.hostname+ port;
const restApiEndpoint = "/game/questioner";
const restApiUrlQuestioner = restApiUrl + restApiEndpoint;

// global variables
// game data
let maxPlayer = 0;
let players = [];
let question = "お待ちください";
let playerAnswers = [];
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

socket.addEventListener("message", (event) => {
    console.log('WS: message received.');
    const data = event.data;
    let response = JSON.parse(data);
    if (response.destination != undefined && response.destination === "player") {
        const dataType = response.type;
        const body = response.body;
        switch (dataType) {
            case "init":
                console.log(body);
                maxPlayer = body.maxPlayers;
                initPlayers(body.players);
                initAnswers();
                initQuestion(question);
                break;
            case "players":
                renderPlayersArea(body);
                break;
            case "question":
                renderQuestion(body.question);
                initAnswers();
                break;
            case "judge":
                renderAnswers(body.judges);
                break;
            default:
                break;
        }
    }
    if (response.destination != undefined && response.destination === "questioner") {
        const dataType = response.type;
        const body = response.body;
        switch (dataType) {
            case "answer":
                console.log(body);
                setPlayerAnswer(body);
                renderPlayersAnswer(body);
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

function sendQuestion() {
    const question = document.getElementById('question');
    const questionVal = question.value;
    console.log(questionVal);

    const questionData = {
        question: questionVal,
    }
    var questionJson = JSON.stringify(questionData);
    const XHR = new XMLHttpRequest();
    XHR.open('POST', restApiUrlQuestioner + "/question/send");
    XHR.setRequestHeader('Content-Type', 'application/json');
    XHR.send(questionJson);

    resetPlayerAnswers();
}

function sendJudge() {
    const result = {
        judges: playerAnswers
    }
    var req = JSON.stringify(result);
    console.log(req);
    const XHR = new XMLHttpRequest();
    XHR.open('POST', restApiUrlQuestioner + "/question/judge");
    XHR.setRequestHeader('Content-Type', 'application/json');
    XHR.send(req);
}

function renderPlayersArea(p) {
    players = p;
    const other_answer_name = document.getElementsByClassName('other_answer_name');
    for (let index = 0; index < maxPlayer; index++) {
        other_answer_name[index].innerText = "-";
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

function renderQuestion(question) {
    const qc = document.getElementById('question');
    qc.innerText = question;
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
        other_answer_text[index].innerText = "●";
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

function setPlayerAnswer(answer) {
    const player = players.find(e => e.id == answer.id)
    if (player === undefined) {
        return;
    }
    const tmpAnswer = {
        id: answer.id,
        name: player.name,
        answer: answer.answer,
        result: false,
    }
    const index = playerAnswers.findIndex(e => e.id == answer.id);
    if (index === -1) {
        playerAnswers.push(tmpAnswer);
    } else {
        playerAnswers[index] = tmpAnswer;
    }
    return;
}

function resetPlayerAnswers() {
    playerAnswers = [];
}

function renderPlayersAnswer(answer) {
    const other_answer_text = document.getElementsByClassName('other_answer_text');
    for (let index = 0; index < maxPlayer; index++) {
        if (other_answer_text[index].id == answer.id) {
            other_answer_text[index].innerText = answer.answer;
        }
    }
}

function changeAnswerResult(classId) {
    const other_answer_text = document.getElementsByClassName('other_answer_text');
    const other_answer_name = document.getElementsByClassName('other_answer_name');
    const playerName = other_answer_name[classId].innerText;
    const index = playerAnswers.findIndex(e => e.name == playerName);
    if (index === -1) {
        return;
    }

    const player = playerAnswers[index];
    if (player.result === false) {
        playerAnswers[index].result = true;
        other_answer_text[classId].style.backgroundColor = '#ff0000';
    } else {
        playerAnswers[index].result = false;
        other_answer_text[classId].style.backgroundColor = '#0000ff';
    }

    console.log(playerAnswers);
}