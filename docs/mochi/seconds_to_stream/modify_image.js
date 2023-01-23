const canvas = document.getElementById('mochisamune');
const ctx = canvas.getContext('2d');
const image = new Image();
const MAX_SCALE = 3;
const SCALE_STEP = 0.2;
let imageScale = 1, imageScaleIndex = 0;

let baseX, baseY;
let rate = 1;
let continue_flag = true;

let zoomWidth, zoomHeight, zoomLeft = 0, zoomTop = 0;

function draw() {
    image.addEventListener("load", function(){
        ctx.drawImage(image, zoomLeft, zoomTop, canvas.width / imageScale, canvas.height / imageScale, 0, 0, canvas.width, canvas.height);
    });
    image.src = "./mochisamune.png";
}

function canvasZoom() {
    if (continue_flag == false) {
        return;
    }
    baseX = 0;
    baseY = canvas.height;
    
    if (rate > 0) {
        imageScaleIndex++;
        imageScale = 1 + imageScaleIndex * SCALE_STEP;
        if (imageScale > MAX_SCALE) {
            imageScale = MAX_SCALE;
            rate = -1;
            imageScaleIndex--;
            setCountStop();
            setTimeout('setCountStart()', 1000);
        } else {
            zoomWidth = canvas.width / imageScale;
            zoomHeight = canvas.height / imageScale;

            zoomLeft += baseX * SCALE_STEP / (imageScale * (imageScale - SCALE_STEP));
            zoomLeft = Math.max(0, Math.min(canvas.width - zoomWidth, zoomLeft));

            zoomTop += baseY * SCALE_STEP / (imageScale * (imageScale - SCALE_STEP));
            zoomTop = Math.max(0, Math.min(canvas.height - zoomHeight, zoomTop));
        }
    } else {
        imageScaleIndex--;
        imageScale = 1 + imageScaleIndex * SCALE_STEP;
        if (imageScale < 1) {
            imageScale = 1;
            zoomLeft = 0;
            zoomTop = 0;
            rate = 1;
            imageScaleIndex = 0;
        } else {
            zoomWidth = canvas.width / imageScale;
            zoomHeight = canvas.height / imageScale;
            
            zoomLeft -= baseX * SCALE_STEP / (imageScale * (imageScale + SCALE_STEP));
            zoomLeft = Math.max(0, Math.min(canvas.width - zoomWidth, zoomLeft));
            
            zoomTop -= baseY * SCALE_STEP / (imageScale * (imageScale + SCALE_STEP));
            zoomTop = Math.max(0, Math.min(canvas.height - zoomHeight, zoomTop));
        }
    }
    
    draw();
}

function setCountStop() {
    continue_flag = false;
}

function setCountStart() {
    continue_flag = true;
}

draw();
setInterval('canvasZoom()',30);