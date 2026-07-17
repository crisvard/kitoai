/**
 * =====================================================
 * AVIATOR BOT v3.3 — injetar no console da PIXBET
 * =====================================================
 * ➤ VELAS: recebe do Supabase (aviator-collector.js envia)
 * ➤ APOSTA: Angular-compatible, padrão v3.2 (setBetValue + click)
 * ➤ RESULTADO: vela >= cashoutAt = WIN, senão LOSS
 * ➤ SEM WebSocket patch — não crasha a página
 * =====================================================
 * ORDEM:
 * 1. cole aviator-collector.js no console  ← envia velas
 * 2. cole este script no console           ← analisa e aposta
 * =====================================================
 */
(function () {
    'use strict';

    // ─── CLEANUP ──────────────────────────────────────────────
    ['__aviator_bot_v3__', '__aviator_bot_v3_style__'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
    if (window.__avBot3) { try { window.__avBot3.stop(); } catch (e) { } }

    // ─── SUPABASE ─────────────────────────────────────────────
    const SUPA_URL = 'https://hedxxbsieoazrmbayzab.supabase.co';
    const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNjAxNjQsImV4cCI6MjA2MjkzNjE2NH0.pPjEGJ0gTtLxeGUrkDeuh_7zkQWGbD2liccv8kRPJXw';
    const SUPA_HDR = { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` };

    async function supaGet(path) {
        const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: SUPA_HDR });
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
    }

    // ─── CONFIG ───────────────────────────────────────────────
    const CFG_KEY = 'avbot33_cfg';
    function saveCFG() {
        try { localStorage.setItem(CFG_KEY, JSON.stringify(CFG)); } catch { }
    }
    function loadCFG() {
        try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch { return {}; }
    }

    let CFG = Object.assign({
        rangeMin: 1.50,
        rangeMax: 2.00,
        pattern: 2,
        delayMin: 800,
        delayMax: 2200,
        cooldown: 10000,
        cashoutAt: 2.00,
        betBase: 1.00,
        stopLoss: 50.00,
        panel: 0,
        pollMs: 2500,
    }, loadCFG());

    // ─── ESTADO ───────────────────────────────────────────────
    let running = false;
    let inCooldown = false;
    let betPlaced = false;
    let clickCount = 0;
    let streak = 0;
    let totalLoss = 0;
    let pendingBet = false;
    let pollTimer = null;
    let cooldownTimer = null;
    let lastCandleId = 0;

    let martingaleStep = 0;
    let betCurrent = CFG.betBase;
    let skipCandles = 0;

    // ─── HELPERS ──────────────────────────────────────────────
    function humanDelay(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    const nativeInputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    function setAngularInputValue(input, value) {
        nativeInputSetter.call(input, String(value));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    // ─── SELETORES ────────────────────────────────────────────
    function getGameDoc() {
        if (document.querySelector('.payouts-block')) return document;
        for (const f of document.querySelectorAll('iframe')) {
            try {
                const d = f.contentDocument || f.contentWindow?.document;
                if (d && d.querySelector('.payouts-block')) return d;
            } catch { }
        }
        return document;
    }

    function getPanels() {
        const d = getGameDoc();
        const bc = d.querySelectorAll('app-bet-control');
        if (bc.length >= 2)
            return [bc[0].querySelector('.controls'), bc[1].querySelector('.controls')].filter(Boolean);
        return Array.from(d.querySelectorAll('.controls')).filter(c => c.querySelector('button.bet'));
    }

    function getPanel(idx) { return getPanels()[idx] || null; }
    function getBetInput(p) { return p?.querySelector('.spinner.big input, app-spinner .spinner.big input, .bet-block input') || null; }
    function getBetBtn(p) { return p?.querySelector('button.bet') || p?.querySelector('.buttons-block button') || null; }
    function getBetOptBtn(p, v) { return Array.from(p?.querySelectorAll('.bet-opt') || []).find(b => Math.abs(parseFloat(b.textContent) - v) < 0.01) || null; }
    function isInRange(v) { return !isNaN(v) && v >= CFG.rangeMin && v <= CFG.rangeMax; }
    function fireHumanClick(b) { try { b?.focus(); b?.click(); } catch { } }

    // ─── SET BET VALUE ────────────────────────────────────────
    async function setBetValue(panelEl, targetValue) {
        if (!panelEl) return;
        const presets = [10, 20, 50, 100];
        const preset = presets.find(p => Math.abs(p - targetValue) < 0.01);
        if (preset) {
            const btn = getBetOptBtn(panelEl, preset);
            if (btn) { await sleep(humanDelay(80, 200)); fireHumanClick(btn); return; }
        }
        const input = getBetInput(panelEl);
        if (!input) { log('⚠ Input da aposta não encontrado', '#ffd740'); return; }

        input.focus();
        await sleep(humanDelay(80, 150));

        // Selecionar todo conteúdo do campo
        input.select();
        input.setSelectionRange(0, input.value.length);
        await sleep(humanDelay(30, 60));

        // execCommand('insertText') substitui a seleção inteira de uma vez —
        // é o método mais confiável no contexto do console Chrome pois aciona
        // os eventos nativos corretos sem passar pela lógica de adição do spinner.
        const ok = document.execCommand('insertText', false, targetValue.toFixed(2));

        if (ok) {
            // insertText já disparou o evento 'input' — só precisamos do chain Angular
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
        } else {
            // Fallback: forçar via setter nativo (limpa + seta)
            nativeInputSetter.call(input, '');
            input.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(humanDelay(30, 60));
            setAngularInputValue(input, targetValue.toFixed(2));
        }

        await sleep(humanDelay(100, 200));
        log(`📝 Valor definido: R$ ${targetValue.toFixed(2)}`, '#4a5568');
    }

    // ─── MARTINGALE ───────────────────────────────────────────
    function calcNextBet(won) {
        if (won) {
            log(`✅ VITÓRIA! Reset martingale.`, '#00e676');
            martingaleStep = 0;
            skipCandles = 0;
            betCurrent = parseFloat(CFG.betBase.toFixed(2));
        } else {
            totalLoss += betCurrent;
            martingaleStep++;
            skipCandles = 2;
            betCurrent = parseFloat((CFG.betBase * Math.pow(2, martingaleStep)).toFixed(2));
            log(`❌ DERROTA. Passo ${martingaleStep} → R$ ${betCurrent.toFixed(2)} | Skip 2 velas`, '#ff1744');
            if (totalLoss >= CFG.stopLoss) {
                log(`🛑 STOP-LOSS! Perda: R$ ${totalLoss.toFixed(2)}`, '#ff1744');
                stopBot();
                return;
            }
        }
        updateBetDisplay();
        log(`💰 Próxima aposta: R$ ${betCurrent.toFixed(2)}`, '#a855f7');
    }

    // ─── PROCESSAR VELA (vinda do Supabase) ───────────────────
    function onNewCandle(val) {
        const type = isInRange(val) ? 'purple' : 'out';

        // 1) Resultado da aposta ativa
        if (betPlaced) {
            betPlaced = false;
            calcNextBet(val >= CFG.cashoutAt);
            streak = 0;
            updateStreakDisplay();
            setStatus(skipCandles > 0 ? `Aguardando ${skipCandles} velas...` : 'Monitorando...', skipCandles > 0 ? '#ffd740' : '#00e676');
            return;
        }

        // 2) Congelamento pós-perda
        if (skipCandles > 0) {
            skipCandles--;
            log(`⏭ Vela ${val.toFixed(2)}x ignorada (skip). Faltam: ${skipCandles}`, '#4a5568');
            updateBetDisplay();
            return;
        }

        // 3) Contar streak
        if (type === 'purple') {
            streak++;
            updateStreakDisplay();
            log(`🟣 ${val.toFixed(2)}x — ROXA (${streak}ª seguida)`, '#a855f7');
            checkPattern();
        } else {
            if (streak > 0) log(`⬜ ${val.toFixed(2)}x — fora do range — streak zerado`, '#4a5568');
            streak = 0;
            updateStreakDisplay();
        }
    }

    function checkPattern() {
        if (inCooldown || !running || pendingBet) return;
        if (streak >= CFG.pattern) {
            const delay = humanDelay(CFG.delayMin, CFG.delayMax);
            log(`🎯 ${streak} roxas! Apostando R$ ${betCurrent.toFixed(2)} em ${(delay / 1000).toFixed(1)}s...`, '#ffd740');
            setStatus('Padrão detectado! Aguardando...', '#ffd740');
            streak = 0;
            updateStreakDisplay();
            pendingBet = true;
            setTimeout(() => { pendingBet = false; doApostar(); }, delay);
        }
    }

    // ─── APOSTAR ──────────────────────────────────────────────
    async function doApostarPanel(panelIdx) {
        const panelEl = getPanel(panelIdx);
        if (!panelEl) { log(`❌ Painel ${panelIdx + 1} não encontrado`, '#ff1744'); return false; }
        const btn = getBetBtn(panelEl);
        if (!btn || btn.disabled || btn.hasAttribute('disabled')) {
            log(`⏳ Botão painel ${panelIdx + 1} indisponível`, '#4a5568');
            return false;
        }
        await setBetValue(panelEl, betCurrent);
        await sleep(humanDelay(200, 500));
        if (!running) return false;
        const btnNow = getBetBtn(panelEl);
        if (!btnNow || btnNow.disabled) return false;
        fireHumanClick(btnNow);
        clickCount++;
        log(`✅ Aposta #${clickCount} painel ${panelIdx + 1} — R$ ${betCurrent.toFixed(2)}`, '#00e676');
        return true;
    }

    async function doApostar() {
        if (!running) return;
        const pc = CFG.panel;
        setStatus(`Apostando R$${betCurrent.toFixed(2)}...`, '#ffd740');
        let placed = false;
        if (pc === 0 || pc === 2) placed = await doApostarPanel(0) || placed;
        if (pc === 1 || pc === 2) { if (pc === 2) await sleep(humanDelay(150, 400)); placed = await doApostarPanel(1) || placed; }
        if (placed) {
            betPlaced = true;
            document.getElementById('__b3_clicks__').textContent = clickCount;
            setStatus(`Apostou R$${betCurrent.toFixed(2)}! Aguardando vela...`, '#00e676');
            startCooldown();
        }
    }

    // ─── COOLDOWN ─────────────────────────────────────────────
    function startCooldown() {
        inCooldown = true;
        let rem = Math.floor(CFG.cooldown / 1000);
        const el = document.getElementById('__b3_cd__');
        if (el) el.textContent = rem + 's';
        clearInterval(cooldownTimer);
        cooldownTimer = setInterval(() => {
            rem--;
            if (el) el.textContent = rem + 's';
            if (rem <= 0) {
                clearInterval(cooldownTimer);
                inCooldown = false;
                if (el) el.textContent = '—';
                if (!betPlaced) setStatus('Monitorando...', '#00e676');
            }
        }, 1000);
    }

    // ─── POLLING SUPABASE ─────────────────────────────────────
    async function poll() {
        if (!running) return;
        try {
            const rows = await supaGet(`aviator_candles?id=gt.${lastCandleId}&order=id.asc&limit=20`);
            for (const row of rows) {
                lastCandleId = row.id;
                onNewCandle(parseFloat(row.value));
            }
        } catch (e) { /* falhas de rede são silenciosas */ }
    }

    // ─── CONTROLES ────────────────────────────────────────────
    async function startBot() {
        CFG.rangeMin = parseFloat($('__b3_rmin__').value) || 1.5;
        CFG.rangeMax = parseFloat($('__b3_rmax__').value) || 2.0;
        CFG.pattern = parseInt($('__b3_pat__').value) || 2;
        CFG.delayMin = parseFloat($('__b3_dmin__').value) * 1000;
        CFG.delayMax = parseFloat($('__b3_dmax__').value) * 1000;
        CFG.cooldown = parseInt($('__b3_cdval__').value) * 1000;
        CFG.cashoutAt = parseFloat($('__b3_cashout__').value) || 2.0;
        CFG.betBase = parseFloat($('__b3_betbase__').value) || 1.0;
        CFG.stopLoss = parseFloat($('__b3_stoploss__').value) || 50.0;
        CFG.panel = parseInt($('__b3_panel__').value);
        CFG.pollMs = parseInt($('__b3_pollms__').value) * 1000 || 2500;
        saveCFG();

        // Começa do ID mais recente (ignora histórico antigo)
        try {
            const rows = await supaGet('aviator_candles?order=id.desc&limit=1');
            lastCandleId = rows.length > 0 ? rows[0].id : 0;
        } catch { lastCandleId = 0; }

        running = true; inCooldown = false; betPlaced = false;
        pendingBet = false; streak = 0; clickCount = 0;
        martingaleStep = 0; skipCandles = 0;
        betCurrent = CFG.betBase; totalLoss = 0;

        $('__b3_clicks__').textContent = 0;
        $('__b3_cd__').textContent = '—';
        $('__b3_start__').disabled = true;
        $('__b3_stop__').disabled = false;
        $('__b3_stop__').style.opacity = '1';
        updateBetDisplay(); updateStreakDisplay();

        log('🚀 Bot v3.3 iniciado! Recebendo velas do Supabase...', '#00e676');
        log(`⚙ Range: ${CFG.rangeMin}–${CFG.rangeMax}x | Padrão: ${CFG.pattern} | Cashout: ${CFG.cashoutAt}x`, '#4a5568');
        log(`💰 Base: R$${CFG.betBase.toFixed(2)} | Stop-Loss: R$${CFG.stopLoss.toFixed(2)}`, '#a855f7');
        log(`🔍 Painéis encontrados: ${getPanels().length}`, '#4a5568');

        setStatus('Monitorando (Supabase)...', '#00e676');
        pollTimer = setInterval(poll, CFG.pollMs);
    }

    function stopBot() {
        running = false;
        clearInterval(pollTimer);
        clearInterval(cooldownTimer);
        $('__b3_start__').disabled = false;
        $('__b3_stop__').disabled = true;
        $('__b3_stop__').style.opacity = '.5';
        $('__b3_cd__').textContent = '—';
        setStatus('Parado', '#ff1744');
        log('⛔ Bot parado.', '#ff1744');
    }

    // ─── UI HELPERS ───────────────────────────────────────────
    function $(id) { return document.getElementById(id); }
    function setStatus(txt, color) { const e = $('__b3_status__'); if (e) { e.textContent = txt; e.style.color = color; } }
    function updateStreakDisplay() {
        const e = $('__b3_streak__');
        if (e) { e.textContent = streak; e.style.color = streak > 0 ? '#a855f7' : '#4a5568'; }
    }
    function updateBetDisplay() {
        const ev = $('__b3_betval__');
        if (ev) { ev.textContent = `R$ ${betCurrent.toFixed(2)}`; ev.style.color = martingaleStep > 0 ? '#ff1744' : '#00e676'; }
        const es = $('__b3_mstep__');
        if (es) { es.textContent = martingaleStep === 0 ? 'Base (×1)' : `Passo ${martingaleStep} (×${Math.pow(2, martingaleStep)})`; es.style.color = martingaleStep > 0 ? '#ff1744' : '#4a5568'; }
        const el = $('__b3_loss__');
        if (el) { el.textContent = `R$ ${totalLoss.toFixed(2)}`; el.style.color = totalLoss > 0 ? '#ff1744' : '#4a5568'; }
    }
    function log(msg, color) {
        const el = $('__b3_log__');
        if (!el) return;
        const t = new Date().toTimeString().slice(0, 8);
        const d = document.createElement('div');
        d.style.cssText = 'display:flex;gap:8px;line-height:1.8;word-break:break-word';
        d.innerHTML = `<span style="color:#2d3748;flex-shrink:0">${t}</span><span style="color:${color || '#4a5568'}">${msg}</span>`;
        el.appendChild(d);
        el.scrollTop = el.scrollHeight;
        while (el.children.length > 80) el.removeChild(el.firstChild);
    }

    // ─── BUILD UI ─────────────────────────────────────────────
    const css = document.createElement('style');
    css.id = '__aviator_bot_v3_style__';
    css.textContent = `
        @keyframes __avp3{0%,100%{opacity:1}50%{opacity:.25}}
        #__aviator_bot_v3__ .sec{padding:8px 14px;border-bottom:1px solid #1e2329;display:flex;flex-direction:column;gap:6px}
        #__aviator_bot_v3__ .lbl{color:#4a5568;font-size:9px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px}
        #__aviator_bot_v3__ .inp{width:100%;background:#0d1117;border:1px solid #1e2329;border-radius:4px;color:#e2e8f0;font-family:inherit;font-size:11px;padding:4px 7px;outline:none;box-sizing:border-box}
        #__aviator_bot_v3__ .inp:focus{border-color:#a855f7}
        #__aviator_bot_v3__ select.inp{cursor:pointer}
        #__aviator_bot_v3__ .g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        #__aviator_bot_v3__ .row{display:flex;justify-content:space-between;font-size:10px}
        #__aviator_bot_v3__ button:hover:not(:disabled){filter:brightness(1.15)}
    `;
    document.head.appendChild(css);

    const panel = document.createElement('div');
    panel.id = '__aviator_bot_v3__';
    panel.style.cssText = `position:fixed;bottom:20px;right:16px;width:300px;background:#111418;border:1px solid #1e2329;border-radius:10px;font-family:'JetBrains Mono',monospace,sans-serif;font-size:11px;color:#e2e8f0;z-index:2147483647;box-shadow:0 8px 40px rgba(0,0,0,.8);user-select:none;overflow:hidden;max-height:92vh;display:flex;flex-direction:column`;

    panel.innerHTML = `
        <div id="__b3_drag__" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #1e2329;cursor:move;flex-shrink:0">
            <span style="display:flex;align-items:center;gap:8px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:10px;color:#4a5568">
                <span style="width:7px;height:7px;border-radius:50%;background:#a855f7;box-shadow:0 0 8px #a855f7;display:inline-block;animation:__avp3 1.5s infinite"></span>
                Aviator Bot v3.3
            </span>
            <span id="__b3_status__" style="color:#ff1744;font-size:10px;font-weight:600">Parado</span>
        </div>

        <div style="overflow-y:auto;flex:1">
            <div class="sec">
                <div class="lbl">🎮 Painel de Aposta</div>
                <select id="__b3_panel__" class="inp">
                    <option value="0" ${CFG.panel == 0 ? 'selected' : ''}>Painel 1 (esquerdo)</option>
                    <option value="1" ${CFG.panel == 1 ? 'selected' : ''}>Painel 2 (direito)</option>
                    <option value="2" ${CFG.panel == 2 ? 'selected' : ''}>Ambos</option>
                </select>
            </div>

            <div class="sec">
                <div class="lbl">🟣 Range Vela Roxa</div>
                <div class="g2">
                    <div><div class="lbl">Mín (x)</div><input id="__b3_rmin__" type="number" value="${CFG.rangeMin}" step="0.1" class="inp"></div>
                    <div><div class="lbl">Máx (x)</div><input id="__b3_rmax__" type="number" value="${CFG.rangeMax}" step="0.1" class="inp"></div>
                </div>
                <div class="g2">
                    <div>
                        <div class="lbl">Roxas p/ apostar</div>
                        <select id="__b3_pat__" class="inp">
                            <option value="2" ${CFG.pattern == 2 ? 'selected' : ''}>2 velas</option>
                            <option value="3" ${CFG.pattern == 3 ? 'selected' : ''}>3 velas</option>
                            <option value="4" ${CFG.pattern == 4 ? 'selected' : ''}>4 velas</option>
                        </select>
                    </div>
                    <div><div class="lbl">Cooldown (s)</div><input id="__b3_cdval__" type="number" value="${CFG.cooldown / 1000}" min="3" max="120" class="inp"></div>
                </div>
            </div>

            <div class="sec">
                <div class="lbl">⏱ Delay Humano Aleatório (s)</div>
                <div class="g2">
                    <div><div class="lbl">Mín</div><input id="__b3_dmin__" type="number" value="${CFG.delayMin / 1000}" step="0.1" class="inp"></div>
                    <div><div class="lbl">Máx</div><input id="__b3_dmax__" type="number" value="${CFG.delayMax / 1000}" step="0.1" class="inp"></div>
                </div>
            </div>

            <div class="sec">
                <div class="lbl">💰 Martingale</div>
                <div class="g2">
                    <div><div class="lbl">Base (R$)</div><input id="__b3_betbase__" type="number" value="${CFG.betBase}" step="0.5" class="inp"></div>
                    <div><div class="lbl">Stop-Loss (R$)</div><input id="__b3_stoploss__" type="number" value="${CFG.stopLoss}" class="inp"></div>
                </div>
                <div class="g2">
                    <div><div class="lbl">Cashout / WIN (x)</div><input id="__b3_cashout__" type="number" value="${CFG.cashoutAt}" step="0.1" class="inp"></div>
                    <div><div class="lbl">Poll Supabase (s)</div><input id="__b3_pollms__" type="number" value="${CFG.pollMs / 1000}" step="0.5" min="1" class="inp"></div>
                </div>
                <div style="font-size:9px;color:#4a5568;background:#0d1117;padding:5px 8px;border-radius:4px">
                    Vela ≥ cashout = ✅ WIN · Vela &lt; cashout = ❌ LOSS
                </div>
            </div>

            <div class="sec" style="gap:4px">
                <div class="row"><span style="color:#4a5568">Sequência roxa</span><span id="__b3_streak__" style="font-weight:700;color:#4a5568">0</span></div>
                <div class="row"><span style="color:#4a5568">Cooldown</span><span id="__b3_cd__" style="color:#ffd740">—</span></div>
                <div class="row"><span style="color:#4a5568">Total apostas</span><span id="__b3_clicks__" style="color:#00e676;font-weight:700">0</span></div>
                <div class="row"><span style="color:#4a5568">Próx. aposta</span><span id="__b3_betval__" style="color:#00e676;font-weight:700">R$ ${CFG.betBase.toFixed(2)}</span></div>
                <div class="row"><span style="color:#4a5568">Passo Martingale</span><span id="__b3_mstep__" style="color:#4a5568;font-weight:700">Base (×1)</span></div>
                <div class="row"><span style="color:#4a5568">Perda acumulada</span><span id="__b3_loss__" style="color:#4a5568;font-weight:700">R$ 0.00</span></div>
            </div>

            <div id="__b3_log__" style="padding:8px 14px;height:90px;overflow-y:auto;font-size:10px;line-height:1.7;scrollbar-width:thin;scrollbar-color:#1e2329 transparent;flex-shrink:0"></div>

            <div style="padding:10px 14px;display:flex;gap:8px;border-top:1px solid #1e2329;flex-shrink:0">
                <button id="__b3_start__" onclick="window.__avBot3.start()"
                    style="flex:1;padding:9px 0;border-radius:5px;border:none;background:#a855f7;color:#fff;font-family:inherit;font-size:11px;font-weight:700;text-transform:uppercase;cursor:pointer;letter-spacing:.08em">
                    ▶ Iniciar
                </button>
                <button id="__b3_stop__" onclick="window.__avBot3.stop()" disabled
                    style="flex:1;padding:9px 0;border-radius:5px;background:transparent;border:1px solid #ff1744;color:#ff1744;font-family:inherit;font-size:11px;font-weight:700;text-transform:uppercase;cursor:default;letter-spacing:.08em;opacity:.5">
                    ■ Parar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    // Drag
    (function (el) {
        let ox, oy;
        el.querySelector('#__b3_drag__').onmousedown = e => {
            e.preventDefault();
            ox = e.clientX - el.offsetLeft; oy = e.clientY - el.offsetTop;
            document.onmousemove = e2 => { el.style.left = (e2.clientX - ox) + 'px'; el.style.top = (e2.clientY - oy) + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto'; };
            document.onmouseup = () => { document.onmousemove = document.onmouseup = null; };
        };
    })(panel);

    window.__avBot3 = { start: startBot, stop: stopBot };

    log('▶ Bot v3.3 pronto. Cole o aviator-collector.js primeiro, depois clique Iniciar.', '#4a5568');
    log('📡 Velas via Supabase polling — sem WebSocket patch — sem crash.', '#a855f7');
    console.log('%c[AVIATOR BOT v3.3] ✅ Injetado!', 'color:#a855f7;font-weight:bold;font-size:14px');
})();