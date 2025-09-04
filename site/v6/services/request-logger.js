// Dev-only network request logger and request map collector
(function() {
  const DEV = location.search.includes('dev=1');
  if (!DEV) return;

  const originalFetch = window.fetch;
  const logs = [];

  window.fetch = async function(input, init) {
    const startedAt = performance.now();
    const req = typeof input === 'string' ? input : input.url;
    const method = (init && init.method) || 'GET';
    let res, err;
    try {
      res = await originalFetch.apply(this, arguments);
      return res;
    } catch (e) {
      err = e;
      throw e;
    } finally {
      const durationMs = Math.round(performance.now() - startedAt);
      const entry = { time: new Date().toISOString(), method, url: req, status: res?.status, ok: !!res?.ok, durationMs };
      logs.push(entry);
      console.debug('[REQ]', entry);
      try { sessionStorage.setItem('request_map', JSON.stringify(logs.slice(-200))); } catch {}
    }
  };

  // expose for debugging
  window.__requestMap = () => {
    try { return JSON.parse(sessionStorage.getItem('request_map') || '[]'); } catch { return []; }
  };
})();
