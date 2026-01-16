(() => {
  if (!window.VMReal) return;

  const cart = new Map(); // productId -> { productId, sku, name, price, cost, unit, stock, qty }
  let products = [];
  const productById = new Map();

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const money = (n) => `$ ${Number(n || 0).toFixed(2)}`;

  const searchInput = $('[data-search]');
  const productsEl = $('[data-products]');
  const itemsEl = $('[data-items]');
  const subtotalEl = $('[data-subtotal]');
  const taxEl = $('[data-tax]');
  const totalEl = $('[data-total]');

  const modal = $('[data-modal]');
  const modalCloseEls = $$('[data-modal-close]');
  const payBtn = $('[data-pay]');
  const clearBtn = $('[data-clear]');
  const addFirstBtn = $('[data-add-first]');
  const payTotalEl = $('[data-pay-total]');
  const posStatus = $('[data-pos-status]');

  const toastEl = $('[data-toast]');
  let toastTimer = null;
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 2200);
  };

  const setStatus = (msg) => {
    if (posStatus) posStatus.textContent = msg;
  };

  const openModal = () => {
    if (!modal) return;
    modal.hidden = false;
    setStatus('');
    if (payTotalEl) payTotalEl.textContent = totalEl?.textContent || '$ 0.00';
  };

  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
    setStatus('');
  };

  modalCloseEls.forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeModal();
  });

  const computeTotals = () => {
    let subtotal = 0;
    for (const [sku, line] of cart.entries()) {
      subtotal += line.qty * line.price;
    }
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    if (subtotalEl) subtotalEl.textContent = money(subtotal);
    if (taxEl) taxEl.textContent = money(tax);
    if (totalEl) totalEl.textContent = money(total);
    if (payTotalEl) payTotalEl.textContent = money(total);
  };

  const renderCart = () => {
    if (!itemsEl) return;
    const lines = Array.from(cart.values());

    if (lines.length === 0) {
      itemsEl.innerHTML = `<div class="muted">Sin productos. Presiona F2 para buscar.</div>`;
      computeTotals();
      return;
    }

    itemsEl.innerHTML = lines
      .map(
        (l) => `
        <div class="item" data-product-id="${l.productId}">
          <div>
            <div class="item-title">${l.name}</div>
            <div class="item-sub">SKU: ${l.sku || '—'} · ${money(l.price)} c/u · Stock: ${Number(l.stock ?? 0)}</div>
          </div>
          <div class="qty">
            <button class="btn btn-ghost" type="button" data-dec aria-label="Disminuir">−</button>
            <strong>${l.qty}</strong>
            <button class="btn btn-ghost" type="button" data-inc aria-label="Aumentar">+</button>
          </div>
        </div>
      `
      )
      .join('');

    itemsEl.querySelectorAll('[data-inc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('[data-product-id]')?.getAttribute('data-product-id');
        if (!id) return;
        const line = cart.get(id);
        if (!line) return;
        const max = Number(line.stock ?? 0);
        if (max > 0 && line.qty + 1 > max) return toast('Stock insuficiente.');
        line.qty += 1;
        cart.set(id, line);
        renderCart();
      });
    });

    itemsEl.querySelectorAll('[data-dec]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('[data-product-id]')?.getAttribute('data-product-id');
        if (!id) return;
        const line = cart.get(id);
        if (!line) return;
        line.qty -= 1;
        if (line.qty <= 0) cart.delete(id);
        else cart.set(id, line);
        renderCart();
      });
    });

    computeTotals();
  };

  const addToCart = (product) => {
    const id = product.id;
    if (!id) return;
    const existing = cart.get(id);

    const currentStock = Number(product.stock ?? 0);
    if (currentStock <= 0) return toast('Sin stock.');

    if (existing) {
      if (existing.qty + 1 > currentStock) return toast('Stock insuficiente.');
      existing.qty += 1;
      existing.stock = currentStock;
      cart.set(id, existing);
    } else {
      cart.set(id, {
        productId: id,
        sku: product.sku || '',
        name: product.name,
        price: Number(product.price || 0),
        cost: Number(product.cost || 0),
        unit: product.unit || 'pieza',
        stock: currentStock,
        qty: 1
      });
    }
    toast(`Agregado: ${product.name}`);
    renderCart();
  };

  const filteredProducts = () => {
    const q = String(searchInput?.value || '').trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  };

  const renderProducts = () => {
    if (!productsEl) return;
    const list = filteredProducts();

    productsEl.innerHTML = list
      .map(
        (p) => `
        <div class="product" data-product-id="${p.id}">
          <div>
            <h3>${p.name}</h3>
            <div class="muted">SKU: ${p.sku || '—'} · Stock: ${Number(p.stock ?? 0)} · Unidad: ${p.unit || 'pieza'}</div>
          </div>
          <div class="price-tag">
            <div class="money">${money(p.price)}</div>
            <button class="btn btn-primary" type="button" data-add>Agregar</button>
          </div>
        </div>
      `
      )
      .join('');

    productsEl.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('[data-product-id]')?.getAttribute('data-product-id');
        const p = products.find((x) => x.id === id);
        if (p) addToCart(p);
      });
    });
  };

  if (searchInput) {
    searchInput.addEventListener('input', renderProducts);
    searchInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const list = filteredProducts();
        if (list[0]) addToCart(list[0]);
      }
    });
  }

  if (addFirstBtn) {
    addFirstBtn.addEventListener('click', () => {
      const list = filteredProducts();
      if (list[0]) addToCart(list[0]);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      cart.clear();
      toast('Venta cancelada.');
      renderCart();
    });
  }

  if (payBtn) {
    payBtn.addEventListener('click', () => {
      if (cart.size === 0) return toast('Agrega productos antes de cobrar.');
      openModal();
    });
  }

  document.querySelectorAll('[data-pay-method]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (cart.size === 0) return;
      const method = btn.getAttribute('data-pay-method') || 'Contado';

      setStatus('Registrando venta…');

      const items = Array.from(cart.values()).map((l) => ({ productId: l.productId, qty: l.qty }));

      try {
        await window.VMReal.api('/api/sales', {
          method: 'POST',
          body: JSON.stringify({ items, paymentMethod: method })
        });
        toast(`Cobrado: ${method}`);
        cart.clear();
        closeModal();
        await refreshProducts();
        renderCart();
      } catch (e) {
        setStatus(e.message || 'Error al registrar la venta.');
      }
    });
  });

  // Atajos F2–F10 (demo)
  document.addEventListener('keydown', (ev) => {
    const key = ev.key;

    if (key === 'F2') {
      ev.preventDefault();
      searchInput?.focus();
      toast('Buscar producto (F2)');
    }

    if (key === 'F3') {
      ev.preventDefault();
      cart.clear();
      renderCart();
      toast('Cancelar venta (F3)');
    }

    if (key === 'F4') {
      ev.preventDefault();
      toast('Buscar ticket (F4) — demo');
    }

    if (key === 'F5') {
      ev.preventDefault();
      toast('Punto de venta (F5)');
      window.location.href = 'pos.html';
    }

    if (key === 'F6') {
      ev.preventDefault();
      toast('Cambiar precio (F6) — demo');
    }

    if (key === 'F7') {
      ev.preventDefault();
      toast('Ajuste Express (F7) — demo');
    }

    if (key === 'F8') {
      ev.preventDefault();
      toast('Editar producto (F8) — demo');
    }

    if (key === 'F9') {
      ev.preventDefault();
      if (cart.size === 0) return toast('Agrega productos antes de cobrar.');
      openModal();
      toast('Cobrar (F9)');
    }

    if (key === 'F10') {
      ev.preventDefault();
      toast('Corte de caja (F10) — demo');
    }
  });

  const refreshProducts = async () => {
    const { products: list } = await window.VMReal.api('/api/products');
    products = list || [];
    productById.clear();
    products.forEach((p) => productById.set(p.id, p));

    // Sincroniza stock en carrito
    for (const [id, line] of cart.entries()) {
      const p = productById.get(id);
      if (!p) {
        cart.delete(id);
        continue;
      }
      line.stock = Number(p.stock ?? 0);
      if (line.qty > line.stock) line.qty = Math.max(0, line.stock);
      if (line.qty <= 0) cart.delete(id);
      else cart.set(id, line);
    }
  };

  const init = async () => {
    const user = await window.VMReal.requireMe();
    if (!user) return;
    const userEl = document.querySelector('[data-pos-user]');
    if (userEl) userEl.textContent = `${user.name || 'Usuario'} · ${user.plan || 'Plan'} · ${user.email}`;

    const logoutBtn = document.querySelector('[data-logout]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await window.VMReal.logout();
        window.location.href = 'login.html';
      });
    }

    await refreshProducts();
    renderProducts();
    renderCart();
  };

  init().catch((e) => {
    console.error(e);
    alert(e.message || 'Error');
  });
})();
