// init my data
const roomKey = getParam("room")??"";

// websocket
const uri = new URL(window.location.href);
const port = ":5656"
// const port = ""
const websocketEndpoint = "/ws/spectate"
const wsParameter = "?session="+roomKey;
// const socket = new WebSocket('ws://' + uri.hostname + port + websocketEndpoint + wsParameter);
const socket = new WebSocket('wss://' + uri.hostname + port + websocketEndpoint + wsParameter);

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
                maxPlayer = body.maxPlayers;
                initPlayers(body.players);
                initAnswers();
                initQuestion(question);
                break;
            case "players":
                renderPlayersArea(body);
                break;
            case "editSession":
                maxPlayer = body.maxPlayers;
                initPlayers(body.players);
                initAnswers();
                initQuestion(question);
                break;
            case "question":
                renderQuestion(body.question);
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

function initMyData() {

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
    const other_answers = document.getElementById('other_answers');
    const initialChild = other_answers.children[0];
    console.log(initialChild);
    while( other_answers.firstChild ){
        other_answers.removeChild( other_answers.firstChild );
    }
    for (let index = 0; index < maxPlayer; index++) {
        other_answers.appendChild(initialChild.cloneNode(true));
    }
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
    const other_answer_text = document.getElementsByClassName('other_answer_text');
    const canvasHeight = "150";
    const canvasWidth = "280";
    console.log(maxPlayer);
    for (let index = 0; index < maxPlayer; index++) {
        for (let i = 0; i < answers.length; i++) {
            if (undefined !== players[index]) {
                const pos = players[index].position-1;
                if (other_answer_text[pos].id === answers[i].id) {
                    const context = other_answer_text[pos].getContext("2d");
                    other_answer_text[pos].setAttribute('height', canvasHeight);
                    other_answer_text[pos].setAttribute('width', canvasWidth);
                    const image = new Image();
                    image.src = answers[i].answer;
                    image.onload = function() {
                        context.drawImage(image, 0, 0, canvasWidth, canvasHeight);
                    }    
                    if (answers[i].result === true) {
                        other_answer_text[pos].style.backgroundColor  = '#ff0000';
                    } else {
                        other_answer_text[pos].style.backgroundColor  = '#0000ff';
                    }
                    break;
                }    
            }
        }
    }
}

function initAnswers() {
    const other_answer_text = document.getElementsByClassName('other_answer_text');
    const canvasHeight = "150";
    const canvasWidth = "280";
    for (let index = 0; index < maxPlayer; index++) {
        const context = other_answer_text[index].getContext("2d");
        context.beginPath();
        context.fillStyle = 'rgb( 0, 0, 255)';
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        other_answer_text[index].setAttribute('height', canvasHeight);
        other_answer_text[index].setAttribute('width', canvasWidth);
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
    answerText.innerText = "";
}
