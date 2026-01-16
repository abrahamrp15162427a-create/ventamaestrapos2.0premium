const path = require('path');
const crypto = require('crypto');

const express = require('express');
const cookieSession = require('cookie-session');

const { readStore, updateStore } = require('./src/store');
const { createUser, normalizeEmail, verifyPassword } = require('./src/auth');

const PORT = process.env.PORT ? Number(process.env.PORT) : 5500;

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-change-me';

const app = express();
app.disable('x-powered-by');

app.use(express.json({ limit: '1mb' }));

// PWA helpers
app.get('/manifest.webmanifest', (req, res) => {
  res.type('application/manifest+json');
  res.sendFile(path.join(__dirname, 'manifest.webmanifest'));
});

app.get('/sw.js', (req, res) => {
  // Evita caché agresiva del service worker
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'sw.js'));
});

app.use(
  cookieSession({
    name: 'vm_session',
    secret: SESSION_SECRET,
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 14 // 14 días
  })
);

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  next();
}

function requireAuthPage(req, res, next) {
  if (!req.session || !req.session.userId) {
    const nextPath = encodeURIComponent(req.path.replace(/^\//, ''));
    res.redirect(`/login.html?next=${nextPath || 'admin.html'}`);
    return;
  }
  next();
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, plan: u.plan, createdAt: u.createdAt };
}

async function seedInitialAdminIfNeeded() {
  await updateStore(async (store) => {
    if (store.users.length > 0) return store;

    const email = process.env.ADMIN_EMAIL || 'abrahamreyesperez804@gmail.com';
    const password = process.env.ADMIN_PASSWORD || '123456789';
    const name = process.env.ADMIN_NAME || 'Abraham';
    const plan = process.env.ADMIN_PLAN || 'De por vida';

    const admin = createUser({ email, password, name, plan });
    return { ...store, users: [admin] };
  });
}

// ---- AUTH API ----
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const emailNorm = normalizeEmail(email);
  const pass = String(password || '');

  const store = readStore();
  const user = store.users.find((u) => u.email === emailNorm);
  if (!user || !verifyPassword(user, pass)) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  req.session.userId = user.id;
  res.json({ ok: true, user: publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  const store = readStore();
  const user = store.users.find((u) => u.id === req.session.userId);
  if (!user) {
    req.session = null;
    res.status(401).json({ error: 'Sesión inválida' });
    return;
  }
  res.json({ user: publicUser(user) });
});

// ---- PRODUCTS ----
app.get('/api/products', requireAuth, (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const store = readStore();
  const list = q
    ? store.products.filter(
        (p) =>
          String(p.name || '').toLowerCase().includes(q) ||
          String(p.sku || '').toLowerCase().includes(q)
      )
    : store.products;
  res.json({ products: list });
});

app.post('/api/products', requireAuth, async (req, res) => {
  const body = req.body || {};
  const sku = String(body.sku || '').trim();
  const name = String(body.name || '').trim();
  const price = Number(body.price || 0);
  const cost = Number(body.cost || 0);
  const unit = String(body.unit || 'pieza').trim() || 'pieza';
  const minStock = Number(body.minStock || 0);
  const stock = Number(body.stock || 0);

  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  if (Number.isNaN(price) || price < 0) return res.status(400).json({ error: 'Precio inválido' });
  if (Number.isNaN(cost) || cost < 0) return res.status(400).json({ error: 'Costo inválido' });

  const product = {
    id: crypto.randomUUID(),
    sku,
    name,
    price,
    cost,
    unit,
    stock,
    minStock,
    createdAt: new Date().toISOString()
  };

  const next = await updateStore(async (store) => {
    return { ...store, products: [product, ...store.products] };
  });

  res.json({ ok: true, product, products: next.products });
});

app.put('/api/products/:id', requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const patch = req.body || {};

  const next = await updateStore(async (store) => {
    const products = store.products.map((p) => {
      if (p.id !== id) return p;
      const updated = {
        ...p,
        sku: patch.sku !== undefined ? String(patch.sku || '').trim() : p.sku,
        name: patch.name !== undefined ? String(patch.name || '').trim() : p.name,
        price: patch.price !== undefined ? Number(patch.price || 0) : p.price,
        cost: patch.cost !== undefined ? Number(patch.cost || 0) : p.cost,
        unit: patch.unit !== undefined ? String(patch.unit || '').trim() || 'pieza' : p.unit,
        minStock: patch.minStock !== undefined ? Number(patch.minStock || 0) : p.minStock
      };
      return updated;
    });
    return { ...store, products };
  });

  const product = next.products.find((p) => p.id === id);
  if (!product) return res.status(404).json({ error: 'No encontrado' });
  res.json({ ok: true, product });
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const next = await updateStore(async (store) => {
    return { ...store, products: store.products.filter((p) => p.id !== id) };
  });
  res.json({ ok: true, products: next.products });
});

// ---- CUSTOMERS ----
app.get('/api/customers', requireAuth, (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const store = readStore();
  const list = q
    ? store.customers.filter(
        (c) =>
          String(c.name || '').toLowerCase().includes(q) ||
          String(c.phone || '').toLowerCase().includes(q)
      )
    : store.customers;
  res.json({ customers: list });
});

app.post('/api/customers', requireAuth, async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const email = normalizeEmail(body.email);
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });

  const customer = {
    id: crypto.randomUUID(),
    name,
    phone,
    email: email || '',
    createdAt: new Date().toISOString()
  };

  const next = await updateStore(async (store) => {
    return { ...store, customers: [customer, ...store.customers] };
  });

  res.json({ ok: true, customer, customers: next.customers });
});

app.put('/api/customers/:id', requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const patch = req.body || {};

  const next = await updateStore(async (store) => {
    const customers = store.customers.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        name: patch.name !== undefined ? String(patch.name || '').trim() : c.name,
        phone: patch.phone !== undefined ? String(patch.phone || '').trim() : c.phone,
        email: patch.email !== undefined ? normalizeEmail(patch.email) : c.email
      };
    });
    return { ...store, customers };
  });

  const customer = next.customers.find((c) => c.id === id);
  if (!customer) return res.status(404).json({ error: 'No encontrado' });
  res.json({ ok: true, customer });
});

app.delete('/api/customers/:id', requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const next = await updateStore(async (store) => {
    return { ...store, customers: store.customers.filter((c) => c.id !== id) };
  });
  res.json({ ok: true, customers: next.customers });
});

// ---- INVENTORY ----
app.get('/api/inventory/movements', requireAuth, (req, res) => {
  const store = readStore();
  res.json({ movements: store.inventoryMovements });
});

app.post('/api/inventory/move', requireAuth, async (req, res) => {
  const { productId, qty, type, reason } = req.body || {};
  const q = Number(qty || 0);
  const t = String(type || '').trim();
  if (!productId) return res.status(400).json({ error: 'productId requerido' });
  if (!['in', 'out', 'adjust'].includes(t)) return res.status(400).json({ error: 'type inválido' });
  if (Number.isNaN(q) || q === 0) return res.status(400).json({ error: 'qty inválido' });

  const movement = {
    id: crypto.randomUUID(),
    productId: String(productId),
    qty: q,
    type: t,
    reason: String(reason || '').trim(),
    byUserId: String(req.session.userId),
    createdAt: new Date().toISOString()
  };

  const next = await updateStore(async (store) => {
    const products = store.products.map((p) => {
      if (p.id !== movement.productId) return p;
      const current = Number(p.stock || 0);
      const delta = t === 'in' ? q : t === 'out' ? -q : q;
      return { ...p, stock: current + delta };
    });
    return { ...store, products, inventoryMovements: [movement, ...store.inventoryMovements] };
  });

  res.json({ ok: true, movement, products: next.products });
});

// ---- SALES / POS ----
app.post('/api/sales', requireAuth, async (req, res) => {
  const { items, paymentMethod, customerId } = req.body || {};
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return res.status(400).json({ error: 'Items requeridos' });

  const method = String(paymentMethod || 'Contado');
  const saleId = crypto.randomUUID();

  const next = await updateStore(async (store) => {
    const productById = new Map(store.products.map((p) => [p.id, p]));

    const normalizedItems = list.map((it) => {
      const productId = String(it.productId || '');
      const qty = Number(it.qty || 0);
      const p = productById.get(productId);
      if (!p) throw new Error('Producto no existe');
      if (Number.isNaN(qty) || qty <= 0) throw new Error('Cantidad inválida');

      return {
        productId,
        sku: p.sku,
        name: p.name,
        qty,
        price: Number(p.price || 0),
        cost: Number(p.cost || 0)
      };
    });

    // Ajusta stock
    const products = store.products.map((p) => {
      const line = normalizedItems.find((x) => x.productId === p.id);
      if (!line) return p;
      return { ...p, stock: Number(p.stock || 0) - line.qty };
    });

    const subtotal = normalizedItems.reduce((acc, it) => acc + it.qty * it.price, 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;
    const profit = normalizedItems.reduce((acc, it) => acc + it.qty * (it.price - it.cost), 0);

    const sale = {
      id: saleId,
      items: normalizedItems,
      paymentMethod: method,
      customerId: customerId ? String(customerId) : '',
      totals: { subtotal, tax, total, profit },
      byUserId: String(req.session.userId),
      createdAt: new Date().toISOString()
    };

    return { ...store, products, sales: [sale, ...store.sales] };
  });

  res.json({ ok: true, saleId, sales: next.sales, products: next.products });
});

// ---- REPORTS ----
app.get('/api/reports/summary', requireAuth, (req, res) => {
  const store = readStore();

  const revenue = store.sales.reduce((acc, s) => acc + Number(s.totals?.total || 0), 0);
  const profit = store.sales.reduce((acc, s) => acc + Number(s.totals?.profit || 0), 0);
  const salesCount = store.sales.length;
  const lowStockCount = store.products.filter((p) => Number(p.stock || 0) <= Number(p.minStock || 0)).length;

  res.json({
    summary: {
      salesCount,
      revenue,
      profit,
      productsCount: store.products.length,
      customersCount: store.customers.length,
      lowStockCount
    }
  });
});

// ---- PAGES (protected) ----
app.get('/pos.html', requireAuthPage, (req, res) => res.sendFile(path.join(__dirname, 'pos.html')));
app.get('/admin.html', requireAuthPage, (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/products.html', requireAuthPage, (req, res) => res.sendFile(path.join(__dirname, 'products.html')));
app.get('/customers.html', requireAuthPage, (req, res) => res.sendFile(path.join(__dirname, 'customers.html')));
app.get('/inventory.html', requireAuthPage, (req, res) => res.sendFile(path.join(__dirname, 'inventory.html')));
app.get('/reports.html', requireAuthPage, (req, res) => res.sendFile(path.join(__dirname, 'reports.html')));

// ---- STATIC (block /data and /src) ----
app.use((req, res, next) => {
  if (req.path.startsWith('/data') || req.path.startsWith('/src')) {
    res.status(404).send('Not found');
    return;
  }
  next();
});

app.use(
  express.static(__dirname, {
    index: false,
    dotfiles: 'ignore',
    fallthrough: true
  })
);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

seedInitialAdminIfNeeded()
  .then(() => {
    const maxAttempts = 20;
    const start = (port, attempt = 0) => {
      const server = app.listen(port, () => {
        console.log(`Servidor: http://localhost:${port}`);
        console.log('Login: /login.html');
        console.log('Panel: /admin.html');
        console.log('POS: /pos.html');
      });

      server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE' && attempt < maxAttempts) {
          const nextPort = port + 1;
          console.warn(`Puerto ${port} ocupado. Probando ${nextPort}...`);
          // Si falló el bind, el server puede no estar "listening"; no intentes close().
          start(nextPort, attempt + 1);
          return;
        }
        console.error('Error al iniciar servidor:', err);
        process.exit(1);
      });
    };

    start(PORT);
  })
  .catch((err) => {
    console.error('Error al iniciar:', err);
    process.exit(1);
  });
