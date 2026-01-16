(() => {
  const root = document.documentElement;

  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const themeToggle = document.querySelector('[data-theme-toggle]');
  const savedTheme = localStorage.getItem('vm_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    root.setAttribute('data-theme', savedTheme);
  }

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('vm_theme', theme);
    if (themeToggle) {
      themeToggle.textContent = theme === 'light' ? 'Oscuro' : 'Claro';
      themeToggle.setAttribute('aria-label', theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
    }
  };

  // Inicializa texto del botón
  const currentTheme = root.getAttribute('data-theme') || 'dark';
  applyTheme(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const now = root.getAttribute('data-theme') || 'dark';
      applyTheme(now === 'light' ? 'dark' : 'light');
    });
  }

  const header = document.querySelector('[data-elevate]');
  const setHeader = () => {
    const elevated = window.scrollY > 4;
    if (header) header.setAttribute('data-elevate', elevated ? 'true' : 'false');
  };
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  const toTop = document.querySelector('[data-to-top]');
  const setToTop = () => {
    if (!toTop) return;
    const show = window.scrollY > 500;
    toTop.setAttribute('data-show', show ? 'true' : 'false');
  };
  setToTop();
  window.addEventListener('scroll', setToTop, { passive: true });
  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const links = document.querySelector('[data-nav-links]');

  const closeNav = () => {
    if (!nav || !toggle) return;
    nav.removeAttribute('data-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', isOpen ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });
  }

  if (links) {
    links.addEventListener('click', (ev) => {
      const a = ev.target.closest('a');
      if (a) closeNav();
    });
  }

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeNav();
  });

  const form = document.querySelector('[data-contact-form]');
  const status = document.querySelector('[data-form-status]');

  const setStatus = (msg) => {
    if (status) status.textContent = msg;
  };

  if (form) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();

      const formData = new FormData(form);
      const name = String(formData.get('name') ?? '').trim();
      const company = String(formData.get('company') ?? '').trim();
      const email = String(formData.get('email') ?? '').trim();
      const message = String(formData.get('message') ?? '').trim();

      if (name.length < 2) return setStatus('Por favor, escribe tu nombre.');
      if (!email.includes('@')) return setStatus('Por favor, escribe un email válido.');
      if (message.length < 10) return setStatus('Cuéntame un poco más (mínimo 10 caracteres).');

      setStatus('Listo. Abriendo tu app de correo…');

      const subject = encodeURIComponent(`Demo Venta Maestra — ${name}${company ? ' (' + company + ')' : ''}`);
      const body = encodeURIComponent(
        `Nombre: ${name}\n` +
          (company ? `Empresa: ${company}\n` : '') +
          `Email: ${email}\n\n` +
          `Mensaje:\n${message}\n`
      );

      // Cambia este email por el tuyo:
      const to = 'ventas@ventamaestra.com';
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

      form.reset();
      setTimeout(() => setStatus(''), 4000);
    });
  }
})();
