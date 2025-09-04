const THEME_KEY = 'ui_theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function loadTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch { return null; }
}

function saveTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
}

function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  const saved = loadTheme();
  if (saved === 'light' || saved === 'dark') applyTheme(saved);

  const updateIcon = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    btn.querySelector('i')?.classList.toggle('fa-moon', !isDark);
    btn.querySelector('i')?.classList.toggle('fa-sun', isDark);
  };

  updateIcon();

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
    updateIcon();
  });
}

document.addEventListener('DOMContentLoaded', initThemeToggle);
