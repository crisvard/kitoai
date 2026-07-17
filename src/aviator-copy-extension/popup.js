const statusEl = document.getElementById('status');

function setStatus(text, color) {
  statusEl.textContent = text;
  statusEl.style.color = color || '#4a5568';
}

async function copyScript(fileName, label) {
  try {
    setStatus('Carregando...', '#ffd740');
    const url = chrome.runtime.getURL(fileName);
    const response = await fetch(url);
    if (!response.ok) {
      setStatus('Erro ao carregar arquivo.', '#ff1744');
      return;
    }
    const text = await response.text();
    await navigator.clipboard.writeText(text);
    setStatus(`✅ ${label} copiado!`, '#00e676');
  } catch (e) {
    setStatus('Erro: ' + e.message, '#ff1744');
  }
}

document.getElementById('btnCollector').addEventListener('click', () => {
  copyScript('scripts/aviator-collector.js', 'Script 1');
});

document.getElementById('btnBot').addEventListener('click', () => {
  copyScript('scripts/aviator-bot-v3.js', 'Script 2');
});
