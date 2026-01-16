(() => {
  const userEl = document.querySelector('[data-user]');
  const logoutBtn = document.querySelector('[data-logout]');

  const salesCountEl = document.querySelector('[data-sales-count]');
  const revenueEl = document.querySelector('[data-revenue]');
  const profitEl = document.querySelector('[data-profit]');
  const lowStockEl = document.querySelector('[data-low-stock]');

  const money = (n) => `$ ${Number(n || 0).toFixed(2)}`;

  const run = async () => {
    const user = await window.VMReal.requireMe();
    if (!user) return;

    if (userEl) userEl.textContent = `${user.name} · ${user.plan} · ${user.email}`;

    const { summary } = await window.VMReal.api('/api/reports/summary');
    if (salesCountEl) salesCountEl.textContent = String(summary.salesCount);
    if (revenueEl) revenueEl.textContent = money(summary.revenue);
    if (profitEl) profitEl.textContent = money(summary.profit);
    if (lowStockEl) lowStockEl.textContent = String(summary.lowStockCount);
  };

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.VMReal.logout();
      window.location.href = '/login.html';
    });
  }

  run().catch((e) => {
    console.error(e);
    alert(e.message || 'Error');
  });
})();
