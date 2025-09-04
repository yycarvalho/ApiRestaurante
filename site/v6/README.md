Order Manager v6 (HTML/CSS/JS only)

How to run
- Open `index.html` in a modern browser. Ensure your API is available at the URL configured in `script.js` (`API_CONFIG.BASE_URL`).
- Optional dev logging: append `?dev=1` to the URL to enable request logging.

Design tokens
- Tokens live in `styles/tokens.css` (colors, spacing, radius, shadow, typography, z-index, motion).
- Override by setting `data-theme="light"` or `data-theme="dark"` on `<html>` or customize CSS variables.

Structure
- styles/: reset.css, tokens.css, base.css, components/, utilities.css, states.css
- components/: theme-toggle.js, command-palette.js
- services/: request-logger.js
- utils/: keyboard-shortcuts.js
- Legacy app code remains in `index.html`, `style.css`, `script.js` and is preserved.

Keyboard shortcuts
- /: focus search
- Ctrl/Cmd+N: new order
- Ctrl/Cmd+K: open command palette
- G then D/P/C/L/R/F: navigate to Dashboard/Pedidos/Cardápio/Clientes/Relatórios/Perfis

Dark/Light mode
- Auto respects system preference. Manual toggle in header switches and persists (`localStorage: ui_theme`).

Request Map
- In dev mode (`?dev=1`), all fetch requests are logged to console and stored in `sessionStorage: request_map`.
- Access the log via `window.__requestMap()`.

Compatibility
- All network endpoints and payloads are unchanged. Enhancements are additive and do not interfere with existing requests or DOM hooks.
