(() => {
  const form = document.querySelector('[data-form]');
  const listEl = document.querySelector('[data-list]');
  const statusEl = document.querySelector('[data-status]');
  const qEl = document.querySelector('[data-q]');
  const refreshBtn = document.querySelector('[data-refresh]');
  const logoutBtn = document.querySelector('[data-logout]');

  const money = (n) => `$ ${Number(n || 0).toFixed(2)}`;
  const setStatus = (m) => {
    if (statusEl) statusEl.textContent = m || '';
  };

  const render = (products) => {
    if (!listEl) return;
    if (!products.length) {
      listEl.innerHTML = `<div class="muted">Sin productos.</div>`;
      return;
    }

    listEl.innerHTML = products
      .map(
        (p) => `
        <div class="item">
          <div>
            <div class="title">${p.name}</div>
            <div class="muted">SKU: ${p.sku || '—'} · Stock: ${Number(p.stock || 0)} · Mín: ${Number(p.minStock || 0)} · Unidad: ${p.unit || 'pieza'}</div>
            <div class="item-actions">
              <button class="btn btn-ghost" type="button" data-edit data-id="${p.id}">Editar</button>
              <button class="btn btn-ghost" type="button" data-del data-id="${p.id}">Eliminar</button>
            </div>
          </div>
          <div class="right">
            <div class="price">${money(p.price)}</div>
            <div class="muted">Costo: ${money(p.cost)}</div>
          </div>
        </div>
      `
      )
      .join('');

    listEl.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        if (!confirm('¿Eliminar este producto?')) return;
        await window.VMReal.api(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
        await load();
      });
    });

    listEl.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        const name = prompt('Nombre (dejar vacío para no cambiar):');
        const price = prompt('Precio (dejar vacío para no cambiar):');
        const cost = prompt('Costo (dejar vacío para no cambiar):');
        const minStock = prompt('Mínimo (dejar vacío para no cambiar):');
        const patch = {};
        if (name !== null && name.trim() !== '') patch.name = name.trim();
        if (price !== null && price.trim() !== '') patch.price = Number(price);
        if (cost !== null && cost.trim() !== '') patch.cost = Number(cost);
        if (minStock !== null && minStock.trim() !== '') patch.minStock = Number(minStock);
        await window.VMReal.api(`/api/products/${encodeURIComponent(id)}`, {
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
    const { products } = await window.VMReal.api(`/api/products${qs}`);
    render(products);
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
        sku: fd.get('sku'),
        name: fd.get('name'),
        price: Number(fd.get('price') || 0),
        cost: Number(fd.get('cost') || 0),
        stock: Number(fd.get('stock') || 0),
        minStock: Number(fd.get('minStock') || 0),
        unit: fd.get('unit')
      };

      try {
        await window.VMReal.api('/api/products', { method: 'POST', body: JSON.stringify(payload) });
        form.reset();
        setStatus('Producto guardado.');
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
