const max = parseInt(getParam("max")??"6");
const dice = document.getElementById("dice");
const diceImg = document.getElementById("diceImg");
const rollButton = document.getElementById("rollButton");

const execFrequency = 49;
const timerSeconds = 3 * 1000;
const diceImages = [
    "img/dice_rolling.gif",
    "img/dice_1.png",
    "img/dice_2.png",
    "img/dice_3.png",
    "img/dice_4.png",
    "img/dice_5.png",
    "img/dice_6.png"
];
let isDiceRolling = false;
let diceReserved = null;

function startDice() {
    setDiceRolling();
    setTimeout(`decideDice(${max});`,timerSeconds);
}

function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function resetDice() {
    if (isDiceRolling === false) {
        diceImg.src = "img/default.gif";
    }
    setButtonEnabled();
}

function decideDice(max) {
    const num = getRandomInt(max);
    diceImg.src = diceImages[num];
    isDiceRolling = false;
    diceReserved = setTimeout(resetDice,3000);
}

function setDiceRolling() {
    setButtonDisable();
    resetDiceDefaultCountdown();
    isDiceRolling = true;
    diceImg.src = diceImages[0];
}

function resetDiceDefaultCountdown() {
    if (diceReserved != null) {
        clearTimeout(diceReserved);
    }
    diceReserved = null;
}

function setButtonDisable() {
    rollButton.disabled = true;
}

function setButtonEnabled() {
    rollButton.disabled = false;
}

function getRandomInt(max) {
    while (true) {
        let n = Math.floor(Math.random() * (max + 1));
        console.log(n);
        if (n != 0) {
            return n;
        }
    }
}
