var isBirthday = false;
var debug = false;
let dbg = getParam("debug");
if (dbg === "1") { 
    debug = true;
}

var headWrap = document.getElementById("count_down_birthday");
var headWrapMsg = document.getElementById("count_down_message");
var headWrapTmr = document.getElementById("count_down_timer");
var headBDayDay = document.getElementById("cd_bday_day");
var headBDayHour = document.getElementById("cd_bday_hour");
var headBDayMin = document.getElementById("cd_bday_min");
var headBDaySec = document.getElementById("cd_bday_sec");

var bDayMsg = document.getElementById("birthday_message");
var bDayNets = document.getElementById("netsurugi_dono_rainbow");
var bDayAA = document.getElementById("netsurugi_dono_rainbow_aa");
var resultCanvas = document.getElementById("result");

 function countToBirthday(bMonth, bDay, element_id) {
    let now = new Date();
    let year = now.getFullYear();

    let bDayStart = Date.parse( year+"-"+bMonth.toString().padStart(2, '0')+"-"+bDay.toString().padStart(2, '0')+"T00:00:00+0900" );
    let bDayEnd = Date.parse( year+"-"+bMonth.toString().padStart(2, '0')+"-"+bDay.toString().padStart(2, '0')+"T23:59:59+0900" );

    let bDayResult ={};
    let remain = 0;
    if (bDayStart > now.getTime()) {
        // console.log("誕生日前");
        bDayResult = getNextBdayCount(bDayStart, now);
        // console.log(bDayResult);
    } else if (now.getTime() > bDayEnd) {
        // console.log("誕生日後");
        let nextBday = Date.parse( (year + 1)+"-"+bMonth.toString().padStart(2, '0')+"-"+bDay.toString().padStart(2, '0')+"T00:00:00+0900" );
        bDayResult = getNextBdayCount(nextBday, now);
        // console.log(bDayResult);
    } else {
        // console.log("誕生日！");
        isBirthday = true;
        return;
    }

    // console.log(now.getTime());
    // console.log(bDayStart);
    // console.log(bDayEnd);
    headBDayDay.innerHTML = bDayResult.day;
    headBDayHour.innerHTML = bDayResult.hour;
    headBDayMin.innerHTML = bDayResult.min;
    headBDaySec.innerHTML = bDayResult.sec;
    isBirthday = false;
}
setInterval('countToBirthday(11, 20, "count_down_timer")',49);

function getNextBdayCount(nextBday, now) {
    remain = nextBday - now.getTime();

    let day = Math.floor(remain / 1000 / 60 / 60/ 24);
    let hour = Math.floor(remain / 1000 / 60 / 60) % 24;
    let min  = Math.floor(remain / 1000 / 60) % 60;
    let sec  = Math.floor(remain / 1000) % 60;
    // msg = day + "日" + hour + "時間" + min + "分" + sec + "秒";
    result = {
        "day": day,
        "hour": hour,
        "min": min,
        "sec": sec,
    }
    return result;
}

function checkBirthday() {
    if (isBirthday === true || debug === true) {
        headWrap.style.display = "none";
        headWrapMsg.style.display = "none";
        headWrapTmr.style.display = "none";
        headBDayDay.style.display = "none";
        headBDayHour.style.display = "none";
        headBDayMin.style.display = "none";
        headBDaySec.style.display = "none";

        bDayMsg.style.display = "block";
        resultCanvas.style.display = "block";
    } else {
        headWrap.style.display = "flex";
        headWrapMsg.style.display = "flex";
        headWrapTmr.style.display = "flex";
        headBDayDay.style.display = "block";
        headBDayHour.style.display = "block";
        headBDayMin.style.display = "block";
        headBDaySec.style.display = "block";

        bDayMsg.style.display = "none";
        resultCanvas.style.display = "none";
    }
}

setInterval('checkBirthday()',49);

function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
eringi_result();
function eringi_result() {
    const canvas = document.getElementById("eringi");
    let imagePath = "./img/eringi_silhouette2.png";
    draw(canvas,imagePath);
}

function draw(canvas,imagePath){
    console.log("draw");
    const image = new Image();
    image.addEventListener("load",function (){
        canvas.width = image.naturalWidth/10;
        canvas.height = image.naturalHeight/10;
        const ctx = canvas.getContext("2d");
        ctx.scale(0.1, 0.1);
        ctx.drawImage(image, 0, 0);
        console.log("load!");
    });
    image.src = imagePath;
}
