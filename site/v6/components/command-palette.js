const PALETTE_ID = 'commandPalette';

const commands = [
  { id: 'nav-dashboard', label: 'Ir para Dashboard', kbd: 'G D', run: () => window.sistema?.navigateToSection('dashboard') },
  { id: 'nav-pedidos', label: 'Ir para Pedidos', kbd: 'G P', run: () => window.sistema?.navigateToSection('pedidos') },
  { id: 'new-order', label: 'Novo Pedido', kbd: 'N', run: () => window.sistema?.showNewOrderModal() },
  { id: 'focus-search', label: 'Focar busca', kbd: '/', run: () => document.getElementById('searchInput')?.focus() },
  { id: 'toggle-theme', label: 'Alternar tema', kbd: 'T', run: () => document.getElementById('themeToggle')?.click() },
];

function openPalette() {
  const dlg = document.getElementById(PALETTE_ID);
  if (!dlg) return;
  dlg.hidden = false;
  document.body.classList.add('is-loading');
  const input = document.getElementById('cmdInput');
  renderList('');
  setTimeout(() => input?.focus(), 0);
  document.getElementById('commandPaletteBtn')?.setAttribute('aria-expanded', 'true');
}

function closePalette() {
  const dlg = document.getElementById(PALETTE_ID);
  if (!dlg) return;
  dlg.hidden = true;
  document.body.classList.remove('is-loading');
  document.getElementById('commandPaletteBtn')?.setAttribute('aria-expanded', 'false');
}

function renderList(query) {
  const list = document.getElementById('cmdList');
  if (!list) return;
  const q = query.trim().toLowerCase();
  const items = commands.filter(c => c.label.toLowerCase().includes(q));
  list.innerHTML = '';
  items.forEach((c, idx) => {
    const el = document.createElement('div');
    el.className = 'cmd-item';
    el.setAttribute('role', 'option');
    el.setAttribute('tabindex', '-1');
    el.setAttribute('aria-selected', String(idx === 0));
    el.dataset.id = c.id;
    el.innerHTML = `<span>${c.label}</span><span class="cmd-kbd">${c.kbd}</span>`;
    el.addEventListener('click', () => { c.run?.(); closePalette(); });
    list.appendChild(el);
  });
}

function initPalette() {
  const btn = document.getElementById('commandPaletteBtn');
  const dlg = document.getElementById(PALETTE_ID);
  const input = document.getElementById('cmdInput');
  const close = document.getElementById('cmdClose');
  if (!btn || !dlg || !input || !close) return;

  btn.addEventListener('click', openPalette);
  close.addEventListener('click', closePalette);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closePalette(); });

  input.addEventListener('input', (e) => renderList(e.target.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePalette(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); closePalette(); }
    if (e.key === 'Enter') {
      const first = document.querySelector('#cmdList .cmd-item');
      if (first) { const id = first.dataset.id; const cmd = commands.find(c => c.id === id); cmd?.run?.(); closePalette(); }
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
  });
}

document.addEventListener('DOMContentLoaded', initPalette);
