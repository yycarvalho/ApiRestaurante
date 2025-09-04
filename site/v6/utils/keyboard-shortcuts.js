function initShortcuts() {
  const search = document.getElementById('searchInput');
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
      e.preventDefault();
      search?.focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      window.sistema?.showNewOrderModal?.();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
      const next = (k) => { e.preventDefault(); window.sistema?.navigateToSection?.(k); };
      const handler = (ev) => {
        const map = { d: 'dashboard', p: 'pedidos', c: 'cardapio', l: 'clientes', r: 'relatorios', f: 'perfis' };
        const key = ev.key.toLowerCase();
        if (map[key]) { next(map[key]); document.removeEventListener('keydown', handler, true); }
      };
      document.addEventListener('keydown', handler, true);
    }
  });

  const densityBtn = document.getElementById('densityToggle');
  densityBtn?.addEventListener('click', () => {
    document.body.classList.toggle('u-compact');
    try { localStorage.setItem('ui_density', document.body.classList.contains('u-compact') ? 'compact' : 'comfortable'); } catch {}
  });

  try {
    const d = localStorage.getItem('ui_density');
    if (d === 'compact') document.body.classList.add('u-compact');
  } catch {}
}

document.addEventListener('DOMContentLoaded', initShortcuts);
