(() => {
  const form = document.querySelector('[data-login-form]');
  const status = document.querySelector('[data-login-status]');

  const params = new URLSearchParams(window.location.search);
  const next = params.get('next') || 'pos.html';

  const setStatus = (msg) => {
    if (status) status.textContent = msg;
  };

  if (!form || !window.VMReal) return;

  // Verifica que el backend real está corriendo en este mismo origen.
  window.VMReal.api('/api/health')
    .then(() => {
      // ok
    })
    .catch((e) => {
      setStatus(e.message || 'No se detecta el servidor real.');
    });

  // Si ya hay sesión, redirige.
  window.VMReal.me()
    .then(() => {
      window.location.href = next;
    })
    .catch(() => {
      // Ignore (no logueado)
    });

  // Prefill para demo (email + pass). Puedes borrar esto si no quieres autocompletar.
  const emailInput = form.querySelector('input[name="email"]');
  const passInput = form.querySelector('input[name="password"]');
  if (emailInput && !emailInput.value) emailInput.value = 'abrahamreyesperez804@gmail.com';
  if (passInput && !passInput.value) passInput.value = '123456789';

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    setStatus('Entrando…');

    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    try {
      await window.VMReal.api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setStatus('Acceso correcto. Abriendo…');
      window.location.href = next;
    } catch (e) {
      setStatus(e.message || 'No se pudo iniciar sesión.');
    }
  });
})();
