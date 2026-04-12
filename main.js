document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const ballWrappers = document.querySelectorAll('.ball-wrapper');
    const balls = document.querySelectorAll('.ball');
    const ballCounts = document.querySelectorAll('.ball-count');
    const historyList = document.getElementById('history-list');
    const themeCheckbox = document.getElementById('theme-checkbox');
    const body = document.body;

    const WHITE_BALL_MAX = 69;
    const POWER_BALL_MAX = 26;
    const BALL_COUNT = 5;

    // ── 테마 ────────────────────────────────────────────────
    function applyTheme(isLight) {
        if (isLight) {
            body.classList.replace('dark-mode', 'light-mode');
            themeCheckbox.checked = true;
        } else {
            body.classList.replace('light-mode', 'dark-mode');
            themeCheckbox.checked = false;
        }
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }
    applyTheme(localStorage.getItem('theme') === 'light');
    themeCheckbox.addEventListener('change', () => applyTheme(themeCheckbox.checked));

    // ── 빈도 추적 (localStorage 영속) ────────────────────────
    function loadFreq(key, max) {
        const saved = localStorage.getItem(key);
        if (saved) return JSON.parse(saved);
        const freq = {};
        for (let i = 1; i <= max; i++) freq[i] = 0;
        return freq;
    }

    function saveFreq(key, freq) {
        localStorage.setItem(key, JSON.stringify(freq));
    }

    let whiteFreq = loadFreq('whiteFreq', WHITE_BALL_MAX);
    let powerFreq = loadFreq('powerFreq', POWER_BALL_MAX);

    // ── 최소 빈도 우선 선택 ──────────────────────────────────
    // 동점 구간에서는 랜덤 셔플로 다양성 확보
    function pickLeastFrequent(freq, max, count) {
        const entries = [];
        for (let i = 1; i <= max; i++) entries.push({ n: i, c: freq[i] });

        // 빈도 오름차순 정렬, 같은 빈도끼리는 랜덤
        entries.sort((a, b) => a.c - b.c || Math.random() - 0.5);

        return entries.slice(0, count).map(e => e.n).sort((a, b) => a - b);
    }

    function pickOneLeastFrequent(freq, max) {
        const entries = [];
        for (let i = 1; i <= max; i++) entries.push({ n: i, c: freq[i] });
        const minC = Math.min(...entries.map(e => e.c));
        const pool = entries.filter(e => e.c === minC);
        return pool[Math.floor(Math.random() * pool.length)].n;
    }

    // ── 빈도 업데이트 ────────────────────────────────────────
    function updateFreq(whites, power) {
        whites.forEach(n => { whiteFreq[n] = (whiteFreq[n] || 0) + 1; });
        powerFreq[power] = (powerFreq[power] || 0) + 1;
        saveFreq('whiteFreq', whiteFreq);
        saveFreq('powerFreq', powerFreq);
    }

    // ── 애니메이션 & 번호 생성 ───────────────────────────────
    async function generateNumbers() {
        generateBtn.disabled = true;

        balls.forEach((ball, i) => {
            ball.textContent = '?';
            ballCounts[i].textContent = '-';
            ball.classList.add('rolling');
        });

        const whiteBalls = pickLeastFrequent(whiteFreq, WHITE_BALL_MAX, BALL_COUNT);
        const powerBall  = pickOneLeastFrequent(powerFreq, POWER_BALL_MAX);
        const allNumbers = [...whiteBalls, powerBall];

        // 빈도 업데이트 (표시 전에 미리 계산)
        updateFreq(whiteBalls, powerBall);

        for (let i = 0; i < balls.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 600));

            balls[i].classList.remove('rolling');
            balls[i].textContent = allNumbers[i];

            // 해당 번호의 누적 횟수 표시
            const ispower = i === BALL_COUNT;
            const cnt = ispower ? powerFreq[allNumbers[i]] : whiteFreq[allNumbers[i]];
            ballCounts[i].textContent = `${cnt}회`;

            balls[i].classList.add('pop');
            setTimeout(() => balls[i].classList.remove('pop'), 300);
        }

        addToHistory(whiteBalls, powerBall);
        generateBtn.disabled = false;
    }

    // ── 히스토리 ─────────────────────────────────────────────
    function addToHistory(whites, power) {
        const now = new Date();
        const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const li = document.createElement('li');
        li.className = 'history-item';

        const whiteBallsHtml = whites.map(n =>
            `<div class="hist-ball hist-white">${n}</div>`
        ).join('');

        li.innerHTML = `
            <div class="history-nums">
                ${whiteBallsHtml}
                <div class="hist-ball hist-power">${power}</div>
            </div>
            <span class="history-time">${timeStr}</span>
        `;

        historyList.prepend(li);
        if (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }
    }

    generateBtn.addEventListener('click', generateNumbers);
});
