document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const balls       = document.querySelectorAll('.ball');
    const ballCounts  = document.querySelectorAll('.ball-count');
    const themeCheckbox = document.getElementById('theme-checkbox');
    const body = document.body;

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

    // ── 실제 파워볼 역대 당첨 빈도 데이터 ────────────────────
    // 출처: powerball-megamillions.com (2015년 현행 룰 적용 이후 누적)
    const WHITE_FREQ = {
         1:92,  2:97,  3:105,  4:91,  5:88,  6:104,  7:94,  8:91,  9:90, 10:90,
        11:98, 12:102, 13:71, 14:87, 15:92, 16:103, 17:93, 18:100, 19:100, 20:99,
        21:119, 22:89, 23:116, 24:94, 25:84, 26:78, 27:113, 28:117, 29:88, 30:94,
        31:95, 32:113, 33:114, 34:82, 35:89, 36:110, 37:106, 38:89, 39:106, 40:99,
        41:87, 42:92, 43:95, 44:103, 45:97, 46:78, 47:108, 48:85, 49:78, 50:95,
        51:87, 52:105, 53:109, 54:95, 55:87, 56:95, 57:92, 58:92, 59:104, 60:90,
        61:120, 62:110, 63:111, 64:115, 65:84, 66:98, 67:98, 68:95, 69:113
    };

    const POWER_FREQ = {
         1:57,  2:51,  3:52,  4:64,  5:57,  6:51,  7:44,  8:45,  9:55, 10:47,
        11:46, 12:44, 13:48, 14:61, 15:42, 16:39, 17:43, 18:59, 19:50, 20:58,
        21:63, 22:45, 23:49, 24:62, 25:57, 26:51
    };

    // ── 최소 빈도 우선 선택 ──────────────────────────────────
    // 동점 구간은 랜덤 셔플로 다양성 확보
    function pickLeastFrequent(freq, count) {
        const entries = Object.entries(freq)
            .map(([n, c]) => ({ n: Number(n), c }))
            .sort((a, b) => a.c - b.c || Math.random() - 0.5);
        return entries.slice(0, count).map(e => e.n).sort((a, b) => a - b);
    }

    function pickOneLeastFrequent(freq) {
        const entries = Object.entries(freq).map(([n, c]) => ({ n: Number(n), c }));
        const minC = Math.min(...entries.map(e => e.c));
        const pool = entries.filter(e => e.c === minC);
        return pool[Math.floor(Math.random() * pool.length)].n;
    }

    // ── 번호 생성 & 애니메이션 ────────────────────────────────
    async function generateNumbers() {
        generateBtn.disabled = true;

        balls.forEach((ball, i) => {
            ball.textContent = '?';
            ballCounts[i].textContent = '-';
            ball.classList.add('rolling');
        });

        const whiteBalls = pickLeastFrequent(WHITE_FREQ, BALL_COUNT);
        const powerBall  = pickOneLeastFrequent(POWER_FREQ);
        const allNumbers = [...whiteBalls, powerBall];

        for (let i = 0; i < balls.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 600));

            balls[i].classList.remove('rolling');
            balls[i].textContent = allNumbers[i];

            const isPower = i === BALL_COUNT;
            const cnt = isPower ? POWER_FREQ[allNumbers[i]] : WHITE_FREQ[allNumbers[i]];
            ballCounts[i].textContent = `${cnt}회`;

            balls[i].classList.add('pop');
            setTimeout(() => balls[i].classList.remove('pop'), 300);
        }

        generateBtn.disabled = false;
    }

    generateBtn.addEventListener('click', generateNumbers);
});
