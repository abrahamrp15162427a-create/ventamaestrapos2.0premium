(() => {
  const form = document.querySelector('[data-form]');
  const productSel = document.querySelector('[data-product]');
  const movesEl = document.querySelector('[data-moves]');
  const statusEl = document.querySelector('[data-status]');
  const refreshBtn = document.querySelector('[data-refresh]');
  const logoutBtn = document.querySelector('[data-logout]');

  let productById = new Map();

  const setStatus = (m) => {
    if (statusEl) statusEl.textContent = m || '';
  };

  const loadProducts = async () => {
    const { products } = await window.VMReal.api('/api/products');
    const byId = new Map((products || []).map((p) => [p.id, p]));
    productById = byId;
    if (productSel) {
      productSel.innerHTML = (products || [])
      .map((p) => `<option value="${p.id}">${p.name} (Stock: ${Number(p.stock || 0)})</option>`)
      .join('');

    }

    return { products: products || [], byId };
  };

  const loadMoves = async () => {
    const { movements } = await window.VMReal.api('/api/inventory/movements');
    if (!movesEl) return;
    if (!movements.length) {
      movesEl.innerHTML = `<div class="muted">Sin movimientos.</div>`;
      return;
    }

    movesEl.innerHTML = movements
      .slice(0, 60)
      .map(
        (m) => `
        <div class="item">
          <div>
            <div class="title">${m.type.toUpperCase()} · Qty: ${m.qty}</div>
            <div class="muted">Producto: ${(productById.get(m.productId)?.name || m.productId)} · ${m.reason || '—'}</div>
          </div>
          <div class="right">
            <div class="muted">${new Date(m.createdAt).toLocaleString()}</div>
          </div>
        </div>
      `
      )
      .join('');
  };

  const refreshAll = async () => {
    await loadProducts();
    await loadMoves();
  };

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.VMReal.logout();
      window.location.href = '/login.html';
    });
  }

  if (refreshBtn) refreshBtn.addEventListener('click', refreshAll);

  if (form) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      setStatus('Aplicando…');

      const fd = new FormData(form);
      const payload = {
        productId: fd.get('productId'),
        type: fd.get('type'),
        qty: Number(fd.get('qty') || 0),
        reason: fd.get('reason')
      };

      try {
        await window.VMReal.api('/api/inventory/move', { method: 'POST', body: JSON.stringify(payload) });
        setStatus('Movimiento aplicado.');
        await refreshAll();
      } catch (e) {
        setStatus(e.message || 'Error');
      }
    });
  }

  const init = async () => {
    await window.VMReal.requireMe();
    await refreshAll();
  };

  init().catch((e) => {
    console.error(e);
    alert(e.message || 'Error');
  });
})();
