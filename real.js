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
      const msg = data?.error || `Error ${res.status}`;
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
