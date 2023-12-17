// init my data
const playerName = getParam("player")??"";
const myPlayerId = getParam("playerId")??"";
let playerPosition = 0;
const roomKey = getParam("room")??"";

// websocket
const uri = new URL(window.location.href);
const websocketEndpoint = "/ws"
const wsParameter = "?session="+roomKey+"&player="+playerName+"&id="+myPlayerId;
// const port = ":5656"
// const restApiUrl = "http://" + uri.hostname+ port;
// const socket = new WebSocket('ws://' + uri.hostname + port + websocketEndpoint + wsParameter);
const port = ""
const restApiUrl = "https://" + uri.hostname+ port;
const socket = new WebSocket('wss://' + uri.hostname + port + websocketEndpoint + wsParameter);

// rest
const restApiEndpoint = "/game/answerer";
const restApiUrlAnswerer = restApiUrl + restApiEndpoint;

// global variables
// game data
let maxPlayer = 0;
let players = [];
let question = "お待ちください";
// view data

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
            case "editSession":
                console.log(body);
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
                initAnswers();
                initMyAnswerText();
                break;
            case "question":
                switch (body.type) {
                    case "image":
                        renderQuestionImage(body.question);
                        break;
                    case "text":
                        renderQuestion(body.question);
                    break;
                    default:
                        break;
                }
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
    const answer = document.getElementById('answer_pict');
    const answerVal = canvas.toDataURL();

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
    const other_answers = document.getElementById('other_answers');
    const initialChild = other_answers.children[0];
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
    qc.innerHTML = '';
    qc.innerText = question;
}

function renderQuestionImage(img) {
    const qc = document.getElementById('question');
    var imageElement = document.createElement('img');
    imageElement.src = img;
    imageElement.width = 360;
    imageElement.height = 180;
    qc.innerHTML = '';
    qc.appendChild(imageElement);
}

function initQuestion(question) {
    renderQuestion(question);
}

function renderAnswers(answers) {
    const other_answer_text = document.getElementsByClassName('other_answer_text');
    const canvasHeight = "75";
    const canvasWidth = "100";
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
    const canvasHeight = "75";
    const canvasWidth = "100";
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
    resetAnswer();
}

const canvas = document.getElementById("answer_pict");
const canvasHeight = "300";
const canvasWidth = "540";
canvas.setAttribute('height', canvasHeight);
canvas.setAttribute('width', canvasWidth);
const context = canvas.getContext("2d");
const penColor = "255, 255, 255, 1";
var penBold = 5;
// 描画中フラグ
let isDrawing = false;
// 直前の座標
let lastX = 0;
let lastY = 0;

// マウスダウンイベント
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  // 現在の座標を更新
  lastX = e.clientX - canvas.offsetLeft;
  lastY = e.clientY - canvas.offsetTop;
});

// マウスアップイベント
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

// マウス移動イベント
canvas.addEventListener("mousemove", draw);

// 描画関数
function draw(e) {
  if (!isDrawing) return;
  context.lineWidth = penBold;
  context.strokeStyle = 'rgba('+penColor+')';
  context.lineCap = 'round';

  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;

  // 直前の座標からの移動距離を計算
  const distance = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);

  // 移動距離に応じて線を描画
  if (distance >= 2) {
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(x, y);
    context.stroke();
    context.closePath();
    
    // 現在の座標を更新
    lastX = x;
    lastY = y;
  }
}

function resetAnswer() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}
