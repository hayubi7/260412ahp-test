document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const ballContainer = document.getElementById('ball-container');
    const balls = document.querySelectorAll('.ball');
    const historyList = document.getElementById('history-list');

    const WHITE_BALL_MAX = 69;
    const POWER_BALL_MAX = 26;
    const BALL_COUNT = 5;

    function getRandomNumbers(max, count) {
        const numbers = new Set();
        while (numbers.size < count) {
            numbers.add(Math.floor(Math.random() * max) + 1);
        }
        return Array.from(numbers).sort((a, b) => a - b);
    }

    function getRandomNumber(max) {
        return Math.floor(Math.random() * max) + 1;
    }

    async function generateNumbers() {
        generateBtn.disabled = true;
        
        // Reset balls and add rolling effect
        balls.forEach(ball => {
            ball.textContent = '?';
            ball.classList.add('rolling');
        });

        // Generate actual numbers
        const whiteBalls = getRandomNumbers(WHITE_BALL_MAX, BALL_COUNT);
        const powerBall = getRandomNumber(POWER_BALL_MAX);
        const allNumbers = [...whiteBalls, powerBall];

        // Animate each ball appearing one by one
        for (let i = 0; i < balls.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 600)); // Delay between balls
            
            balls[i].classList.remove('rolling');
            balls[i].textContent = allNumbers[i];
            balls[i].classList.add('pop');
            
            setTimeout(() => {
                balls[i].classList.remove('pop');
            }, 300);
        }

        addToHistory(whiteBalls, powerBall);
        generateBtn.disabled = false;
    }

    function addToHistory(whites, power) {
        const now = new Date();
        const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        const li = document.createElement('li');
        li.className = 'history-item';
        
        let whiteBallsHtml = whites.map(n => `<div class="hist-ball hist-white">${n}</div>`).join('');
        
        li.innerHTML = `
            <div class="history-nums">
                ${whiteBallsHtml}
                <div class="hist-ball hist-power">${power}</div>
            </div>
            <span class="history-time">${timeStr}</span>
        `;
        
        historyList.prepend(li);
        
        // Keep only last 10 items
        if (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }
    }

    generateBtn.addEventListener('click', generateNumbers);
});
