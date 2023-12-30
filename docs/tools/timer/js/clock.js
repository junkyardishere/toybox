function clock(element_id) {
    var now = new Date();
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString().padStart(2,'0');
    var day = (now.getDate()).toString().padStart(2,'0');

    var hour = now.getHours().toString().padStart(2,'0');
    var min  = now.getMinutes().toString().padStart(2,'0');
    var sec  = now.getSeconds().toString().padStart(2,'0');
    var milliSec = now.getMilliseconds().toString().padStart(3,'0').substring(0,2);
    var msg = year + "/" + month + "/" + day + "　" + hour + ":" + min + ":" + sec;
    // var msg = hour + ":" + min + ":" + sec;
    document.getElementById(element_id).innerHTML = msg;
 }
 setInterval('clock("clock")',50);
