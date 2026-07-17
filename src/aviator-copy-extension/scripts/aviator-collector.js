/**
 * =====================================================
 * aviator-collector.js — Injetar no Console do PIXBET
 * =====================================================
 * Função única: Lê as velas do .payouts-block e 
 * envia para a tabela aviator_candles no Supabase.
 * Também faz polling na tabela aviator_commands para
 * clicar em apostar quando o bot mandar.
 */

(function () {
    const SUPA_URL = 'https://hedxxbsieoazrmbayzab.supabase.co';
    const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9henJtYmF5emFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNjAxNjQsImV4cCI6MjA2MjkzNjE2NH0.pPjEGJ0gTtLxeGUrkDeuh_7zkQWGbD2liccv8kRPJXw';

    let lastSentVal = null;
    let observer = null;
    let cmdPoll = null;

    function log(msg) {
        console.log(`%c[COLLECTOR] ${msg}`, 'color:#00e676;font-weight:bold');
    }

    // --- ENVIAR VELAS ---
    async function sendCandle(val) {
        if (val === lastSentVal) return; // Evita envio duplo se der trigger duas vezes no mesmo valor muito rápido

        try {
            const res = await fetch(`${SUPA_URL}/rest/v1/aviator_candles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPA_KEY,
                    'Authorization': `Bearer ${SUPA_KEY}`
                },
                body: JSON.stringify({ value: val })
            });
            if (res.ok) {
                lastSentVal = val;
                log(`Vela ${val}x enviada.`);
            }
        } catch (e) {
            console.error('Erro ao enviar vela:', e);
        }
    }

    // Procurar doc (útil se estiver em iframe)
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

    function startObserver() {
        const d = getGameDoc();
        const container = d.querySelector('.payouts-block');
        if (!container) {
            log('Aguardando .payouts-block...');
            setTimeout(startObserver, 2000);
            return;
        }

        observer = new MutationObserver(muts => {
            for (const mut of muts) {
                for (const node of mut.addedNodes) {
                    if (node.nodeType === 1) {
                        const el = node.classList?.contains('payout') ? node : node.querySelector?.('.payout');
                        if (el) {
                            const txt = el.textContent.trim().replace(',', '.').replace(/[^0-9.]/g, '');
                            const val = parseFloat(txt);
                            if (!isNaN(val) && val > 0) {
                                sendCandle(val);
                            }
                        }
                    }
                }
            }
        });
        observer.observe(container, { childList: true, subtree: true });
        log('Observador de velas ativo.');
    }

    // --- RECEBER COMANDOS (Apostar) ---

    // Seta input Angular de forma compatível (bypassando validações)
    const nativeInputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    function setAngularInputValue(input, value) {
        nativeInputSetter.call(input, String(value));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    function getPanels() {
        const d = getGameDoc();
        const betControls = d.querySelectorAll('app-bet-control');
        if (betControls.length >= 2) {
            return [betControls[0].querySelector('.controls'), betControls[1].querySelector('.controls')].filter(Boolean);
        }
        return Array.from(d.querySelectorAll('.controls')).filter(c => c.querySelector('button.bet'));
    }

    function getPanel(idx) { return getPanels()[idx] || null; }

    function getBetInput(panelEl) {
        if (!panelEl) return null;
        return panelEl.querySelector('.spinner.big input, app-spinner .spinner.big input, .bet-block input');
    }

    function getBetBtn(panelEl) {
        if (!panelEl) return null;
        return panelEl.querySelector('button.bet') || panelEl.querySelector('.buttons-block button') || null;
    }

    async function setBetValue(panelEl, targetValue) {
        // Tenta preset (10, 20, 50, 100)
        const presets = [10, 20, 50, 100];
        const preset = presets.find(p => Math.abs(p - targetValue) < 0.01);
        if (preset) {
            const btn = Array.from(panelEl.querySelectorAll('.bet-opt')).find(b =>
                Math.abs(parseFloat(b.textContent.trim()) - preset) < 0.01
            );
            if (btn) { btn.focus(); btn.click(); return; }
        }
        const input = getBetInput(panelEl);
        if (!input) { log('⚠ Input não encontrado'); return; }
        input.focus();
        await new Promise(r => setTimeout(r, 120));
        input.select();
        await new Promise(r => setTimeout(r, 80));
        setAngularInputValue(input, targetValue.toFixed(2));
        await new Promise(r => setTimeout(r, 150));
        log(`📝 Aposta definida: R$ ${targetValue.toFixed(2)}`);
    }

    function fireHumanClick(btn) {
        if (!btn) return;
        try { btn.focus(); btn.click(); } catch (e) { }
    }

    async function checkCommands() {
        try {
            const res = await fetch(
                `${SUPA_URL}/rest/v1/aviator_commands?action=eq.bet&status=eq.pending&order=id.asc&limit=1`,
                { headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` } }
            );
            const cmds = await res.json();
            if (!cmds || cmds.length === 0) return;

            const cmd = cmds[0];
            const amount = parseFloat(cmd.amount) || 1.0;
            const panelIdx = parseInt(cmd.panel) || 0;

            // Marca como 'done' PRIMEIRO para não processar duas vezes
            await fetch(`${SUPA_URL}/rest/v1/aviator_commands?id=eq.${cmd.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` },
                body: JSON.stringify({ status: 'done' })
            });

            const panelEl = getPanel(panelIdx);
            if (!panelEl) { log(`⚠ Painel ${panelIdx + 1} não encontrado`); return; }

            const btn = getBetBtn(panelEl);
            if (!btn || btn.disabled || btn.hasAttribute('disabled')) {
                log('⚠ Botão de aposta indisponível');
                return;
            }

            // 1) Seta o valor com compatibilidade Angular
            await setBetValue(panelEl, amount);

            // 2) Verifica botão ainda ativo após setar valor
            await new Promise(r => setTimeout(r, 200));
            const btnNow = getBetBtn(panelEl);
            if (!btnNow || btnNow.disabled) { log('⚠ Botão ficou inativo ao setar valor'); return; }

            // 3) Clica!
            fireHumanClick(btnNow);
            log(`✅ Aposta R$ ${amount.toFixed(2)} no painel ${panelIdx + 1} executada!`);

        } catch (e) {
            // Silencioso — falhas de rede são normais
        }
    }

    startObserver();
    cmdPoll = setInterval(checkCommands, 1000); // Poll leve a cada 1 seg
    log('🚀 Coletor iniciado! Pode minimizar o console.');

    // Expõe kill switch pro console
    window.__collectStop = () => {
        if (observer) observer.disconnect();
        clearInterval(cmdPoll);
        log('⛔ Coletor parado.');
    };
})();
