(() => {
  async function api(path, opts = {}) {
    if (window.location.protocol === 'file:') {
      throw new Error(
        'Esta app debe abrirse desde el servidor (ej: http://localhost:5600/login.html), no como archivo (file://).'
      );
    }

    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      credentials: 'same-origin',
      ...opts
    });

    const text = await res.text();

    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // Puede ser HTML (redirect/login) u otro texto.
        data = { raw: text };
      }
    }

    if (!res.ok) {
      let msg = data?.error || `Error ${res.status}`;

      // Caso común: se abrió con Live Server/GitHub Pages/servidor estático.
      // En esos entornos no existe el backend Express, y un POST a /api/* suele dar 404/405.
      if ((res.status === 404 || res.status === 405) && String(path || '').startsWith('/api/')) {
        msg =
          'No estás abriendo la app desde el servidor REAL de VentaMaestra.\n\n' +
          'Solución: en la carpeta del proyecto ejecuta: npm install (una vez) y luego npm run dev.\n' +
          'Después abre la URL que imprime la terminal (ej: http://localhost:5600/login.html).\n\n' +
          `URL actual: ${window.location.origin}${window.location.pathname}`;
      }

      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    return data;
  }

  async function me() {
    return api('/api/me');
  }

  async function logout() {
    return api('/api/auth/logout', { method: 'POST', body: '{}' });
  }

  async function requireMe() {
    try {
      const { user } = await me();
      return user;
    } catch (e) {
      if (e && e.status === 401) {
        const current = encodeURIComponent(window.location.pathname.split('/').pop() || 'admin.html');
        window.location.href = `/login.html?next=${current}`;
        return null;
      }
      throw e;
    }
  }

  window.VMReal = { api, me, logout, requireMe };
})();
