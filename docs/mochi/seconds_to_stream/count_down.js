let date = 1706014800 * 1000; // 2024-01-23 22:00:00.000 JST
let intervalId = null;

function outputContents() {
    remain = countDown(date);
    if (remain <= 0) {
        document.getElementById("text_1").innerHTML = "もちたろ。は配信しました！";
        document.getElementById("dynamic_text").innerHTML = "";
        document.getElementById("text_2").innerHTML = "";
        clearInterval(intervalId);
        console.log('done!');
        return true;
    } else {
        output = (remain / 1000).toFixed(3).toString();
        document.getElementById("dynamic_text").innerHTML = output;
    }
}

function countDown(date) {
    now = Math.floor(Date.now());
    return date - now;
}

intervalId = setInterval('outputContents()',66);