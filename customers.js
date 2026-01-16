(() => {
  const form = document.querySelector('[data-form]');
  const listEl = document.querySelector('[data-list]');
  const statusEl = document.querySelector('[data-status]');
  const qEl = document.querySelector('[data-q]');
  const refreshBtn = document.querySelector('[data-refresh]');
  const logoutBtn = document.querySelector('[data-logout]');

  const setStatus = (m) => {
    if (statusEl) statusEl.textContent = m || '';
  };

  const render = (customers) => {
    if (!listEl) return;
    if (!customers.length) {
      listEl.innerHTML = `<div class="muted">Sin clientes.</div>`;
      return;
    }

    listEl.innerHTML = customers
      .map(
        (c) => `
        <div class="item">
          <div>
            <div class="title">${c.name}</div>
            <div class="muted">Tel: ${c.phone || '—'} · Email: ${c.email || '—'}</div>
            <div class="item-actions">
              <button class="btn btn-ghost" type="button" data-edit data-id="${c.id}">Editar</button>
              <button class="btn btn-ghost" type="button" data-del data-id="${c.id}">Eliminar</button>
            </div>
          </div>
          <div class="right">
            <div class="muted">${new Date(c.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      `
      )
      .join('');

    listEl.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        if (!confirm('¿Eliminar este cliente?')) return;
        await window.VMReal.api(`/api/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
        await load();
      });
    });

    listEl.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        const name = prompt('Nombre (dejar vacío para no cambiar):');
        const phone = prompt('Teléfono (dejar vacío para no cambiar):');
        const email = prompt('Email (dejar vacío para no cambiar):');
        const patch = {};
        if (name !== null && name.trim() !== '') patch.name = name.trim();
        if (phone !== null && phone.trim() !== '') patch.phone = phone.trim();
        if (email !== null && email.trim() !== '') patch.email = email.trim();
        await window.VMReal.api(`/api/customers/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(patch)
        });
        await load();
      });
    });
  };

  const load = async () => {
    const q = String(qEl?.value || '').trim();
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    const { customers } = await window.VMReal.api(`/api/customers${qs}`);
    render(customers);
  };

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.VMReal.logout();
      window.location.href = '/login.html';
    });
  }

  const init = async () => {
    await window.VMReal.requireMe();
    await load();
  };

  if (refreshBtn) refreshBtn.addEventListener('click', load);
  if (qEl) qEl.addEventListener('input', () => void load());

  if (form) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      setStatus('Guardando…');

      const fd = new FormData(form);
      const payload = {
        name: fd.get('name'),
        phone: fd.get('phone'),
        email: fd.get('email')
      };

      try {
        await window.VMReal.api('/api/customers', { method: 'POST', body: JSON.stringify(payload) });
        form.reset();
        setStatus('Cliente guardado.');
        await load();
      } catch (e) {
        setStatus(e.message || 'Error');
      }
    });
  }

  init().catch((e) => {
    console.error(e);
    alert(e.message || 'Error');
  });
})();
