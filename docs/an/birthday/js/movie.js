document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ascii = document.getElementById('ascii');
    const ctx = canvas.getContext('2d');

    // 視覚的密度に基づくアスキーキャラクターセット（70文字）
    const asciiCharacters = ' .`^",:;Il!i~+_-?][}{1)(|\\/*tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*MW&8%B@$#';

    video.addEventListener('play', () => {
        const width = canvas.width;
        const height = canvas.height;

        const drawAscii = () => {
            if (video.paused || video.ended) return;

            ctx.drawImage(video, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height).data;
            let asciiImage = '';

            for (let y = 0; y < height; y += 3) {  // 縦のステップサイズを調整
                for (let x = 0; x < width; x += 1) {  // 横のステップサイズを調整
                    const offset = (y * width + x) * 4;
                    const r = imageData[offset];
                    const g = imageData[offset + 1];
                    const b = imageData[offset + 2];
                    const brightness = (r + g + b) / 3;
                    const charIndex = Math.floor(brightness / 256 * asciiCharacters.length);
                    asciiImage += asciiCharacters[charIndex];
                }
                asciiImage += '\n';
            }

            ascii.textContent = asciiImage;

            setTimeout(drawAscii, 50);  // フレームレートを制御
        };

        drawAscii();
    });

    // 動画を自動再生
    video.play();
});
