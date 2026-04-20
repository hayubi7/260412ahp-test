document.addEventListener('DOMContentLoaded', () => {
    const themeCheckbox = document.getElementById('theme-checkbox');
    const body          = document.body;
    const refreshBtn    = document.getElementById('refresh-btn');
    const lastUpdated   = document.getElementById('last-updated');
    const tbody         = document.getElementById('stock-tbody');
    const errorMsg      = document.getElementById('error-msg');

    // ── 테마 ────────────────────────────────────────────────
    function applyTheme(isLight) {
        body.classList.toggle('light-mode', isLight);
        body.classList.toggle('dark-mode', !isLight);
        themeCheckbox.checked = isLight;
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }
    applyTheme(localStorage.getItem('theme') === 'light');
    themeCheckbox.addEventListener('change', () => applyTheme(themeCheckbox.checked));

    // ── 포트폴리오 데이터 (2026-03-24 분석 기준) ─────────────
    const STOCKS = [
        { ticker:'APA',  name:'APA Corp',            sector:'Energy',     mktCap:'~12.6B', pe:'8.6',   fwdPe:'9.6',  eps:'3.99', growth:'15.0%', discount:'35.0%',       score:'5.0/4.5/4.7=14.2' },
        { ticker:'GEHC', name:'GE HealthCare',        sector:'HealthCare', mktCap:'~31.9B', pe:'15.6',  fwdPe:'15.3', eps:'4.55', growth:'10.0%', discount:'31.0%',       score:'4.5/4.5/4.8=13.8' },
        { ticker:'VLTO', name:'Veralto Corp',         sector:'Industrials',mktCap:'~22.2B', pe:'23.87', fwdPe:'21.4', eps:'3.76', growth:'12.5%', discount:'25.0%',       score:'4.0/4.5/5.0=13.5' },
        { ticker:'NRG',  name:'NRG Energy',           sector:'Utilities',  mktCap:'~28.3B', pe:'18.4',  fwdPe:'16.8', eps:'4.01', growth:'13.5%', discount:'30.9%',       score:'4.2/4.4/4.5=13.1' },
        { ticker:'ALB',  name:'Albemarle',            sector:'Materials',  mktCap:'~11.8B', pe:'N/A',   fwdPe:'13.5', eps:'N/A',  growth:'15.0%', discount:'70.0%(P/B)',  score:'5.0/3.5/4.2=12.7' },
        { ticker:'CFG',  name:'Citizens Financial',   sector:'Financials', mktCap:'~25.2B', pe:'9.5',   fwdPe:'8.8',  eps:'3.21', growth:'11.0%', discount:'50.0%(P/B)',  score:'4.5/4.0/3.9=12.4' },
        { ticker:'SW',   name:'Smurfit Westrock',     sector:'Materials',  mktCap:'~26.8B', pe:'10.2',  fwdPe:'9.5',  eps:'2.35', growth:'14.0%', discount:'28.0%',       score:'4.2/4.0/4.0=12.2' },
        { ticker:'BALL', name:'Ball Corp',            sector:'Materials',  mktCap:'~14.2B', pe:'15.1',  fwdPe:'14.2', eps:'2.98', growth:'13.5%', discount:'25.0%',       score:'4.0/3.8/4.1=11.9' },
        { ticker:'FITB', name:'Fifth Third',          sector:'Financials', mktCap:'~31.5B', pe:'10.3',  fwdPe:'9.8',  eps:'3.12', growth:'10.5%', discount:'30.0%',       score:'4.0/3.8/3.8=11.6' },
        { ticker:'PODD', name:'Insulet Corp',         sector:'HealthCare', mktCap:'~14.8B', pe:'20',    fwdPe:'18.5', eps:'4.12', growth:'20.0%', discount:'35.0%',       score:'3.5/4.2/3.6=11.3' },
    ];

    const sectorClass = s => 'sector-' + s.replace(/\s/g, '');

    // ── 초기 테이블 렌더 (스켈레톤) ──────────────────────────
    function renderSkeleton() {
        tbody.innerHTML = STOCKS.map(s => `
            <tr id="row-${s.ticker}">
                <td class="ticker-cell">${s.ticker}</td>
                <td>${s.name}</td>
                <td><span class="sector-badge ${sectorClass(s.sector)}">${s.sector}</span></td>
                <td class="price-cell price-loading"><span class="skeleton"></span></td>
                <td><span class="skeleton"></span></td>
                <td>${s.mktCap}</td>
                <td>${s.pe}</td>
                <td>${s.fwdPe}</td>
                <td>${s.eps}</td>
                <td>${s.growth}</td>
                <td>${s.discount}</td>
                <td class="score-cell">${s.score}</td>
            </tr>
        `).join('');
    }

    // ── 실시간 주가 가져오기 ─────────────────────────────────
    // CORS 프록시를 순차 시도해 Yahoo Finance 데이터를 가져옴
    const YAHOO_BASE = symbols =>
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent`;

    const PROXIES = [
        url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
        url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    ];

    async function fetchWithFallback(targetUrl) {
        // 직접 시도
        try {
            const res = await fetch(targetUrl);
            if (res.ok) return res.json();
        } catch (_) { /* CORS 차단 → 프록시로 */ }

        // 프록시 순차 시도
        for (const makeProxy of PROXIES) {
            try {
                const res = await fetch(makeProxy(targetUrl));
                if (res.ok) return res.json();
            } catch (_) { continue; }
        }
        throw new Error('모든 연결 경로 실패');
    }

    async function fetchPrices() {
        refreshBtn.disabled = true;
        refreshBtn.querySelector('i').classList.add('spinning');
        errorMsg.style.display = 'none';

        const symbols = STOCKS.map(s => s.ticker).join(',');

        try {
            const data = await fetchWithFallback(YAHOO_BASE(symbols));
            const results = data?.quoteResponse?.result ?? [];
            if (results.length === 0) throw new Error('빈 응답');

            results.forEach(q => {
                const row = document.getElementById(`row-${q.symbol}`);
                if (!row) return;

                const price  = q.regularMarketPrice;
                const change = q.regularMarketChange;
                const pct    = q.regularMarketChangePercent;

                row.cells[3].textContent = `$${price.toFixed(2)}`;
                row.cells[3].classList.remove('price-loading');

                const sign = change >= 0 ? '+' : '';
                const cls  = change > 0 ? 'change-up' : change < 0 ? 'change-down' : 'change-flat';
                row.cells[4].innerHTML = `<span class="${cls}">${sign}${change.toFixed(2)} (${sign}${pct.toFixed(2)}%)</span>`;
            });

            lastUpdated.textContent = `업데이트: ${new Date().toLocaleTimeString('ko-KR')}`;

        } catch (err) {
            errorMsg.textContent = `⚠️ 주가 로드 실패: ${err.message}`;
            errorMsg.style.display = 'block';
            STOCKS.forEach(s => {
                const row = document.getElementById(`row-${s.ticker}`);
                if (!row) return;
                row.cells[3].textContent = '-';
                row.cells[3].classList.remove('price-loading');
                row.cells[4].textContent = '-';
            });
        } finally {
            refreshBtn.disabled = false;
            refreshBtn.querySelector('i').classList.remove('spinning');
        }
    }

    // ── 초기화 ───────────────────────────────────────────────
    renderSkeleton();
    fetchPrices();

    // 60초 자동 새로고침
    setInterval(fetchPrices, 60_000);

    refreshBtn.addEventListener('click', fetchPrices);
});
