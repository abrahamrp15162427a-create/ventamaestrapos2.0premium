(() => {
  const SESSION_KEY = 'vm_session_v1';

  // Demo local: credenciales embebidas (NO seguro para producción).
  const ALLOWED_USERS = [
    {
      email: 'abrahamreyesperez804@gmail.com',
      password: '123456789',
      name: 'Abraham',
      plan: 'De por vida'
    }
  ];

  const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

  const getSession = () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!parsed.email) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const setSession = (session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
  };

  const signIn = ({ email, password }) => {
    const emailNorm = normalizeEmail(email);
    const pass = String(password || '');

    const user = ALLOWED_USERS.find((u) => normalizeEmail(u.email) === emailNorm && String(u.password) === pass);
    if (!user) {
      return { ok: false, error: 'Credenciales inválidas.' };
    }

    setSession({
      email: user.email,
      name: user.name,
      plan: user.plan,
      expiresAt: null,
      issuedAt: Date.now()
    });

    return { ok: true };
  };

  const signOut = () => {
    clearSession();
  };

  const requireAuthOrRedirect = (to = 'login.html') => {
    const session = getSession();
    if (!session) {
      const next = encodeURIComponent(window.location.pathname.split('/').pop() || 'pos.html');
      window.location.href = `${to}?next=${next}`;
      return null;
    }
    return session;
  };

  window.VMAuth = {
    getSession,
    signIn,
    signOut,
    requireAuthOrRedirect
  };
})();
