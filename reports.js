(() => {
  const logoutBtn = document.querySelector('[data-logout]');
  const refreshBtn = document.querySelector('[data-refresh]');

  const salesEl = document.querySelector('[data-sales]');
  const revenueEl = document.querySelector('[data-revenue]');
  const profitEl = document.querySelector('[data-profit]');
  const productsEl = document.querySelector('[data-products]');
  const customersEl = document.querySelector('[data-customers]');
  const lowEl = document.querySelector('[data-low]');

  const money = (n) => `$ ${Number(n || 0).toFixed(2)}`;

  const load = async () => {
    const { summary } = await window.VMReal.api('/api/reports/summary');
    if (salesEl) salesEl.textContent = String(summary.salesCount);
    if (revenueEl) revenueEl.textContent = money(summary.revenue);
    if (profitEl) profitEl.textContent = money(summary.profit);
    if (productsEl) productsEl.textContent = String(summary.productsCount);
    if (customersEl) customersEl.textContent = String(summary.customersCount);
    if (lowEl) lowEl.textContent = String(summary.lowStockCount);
  };

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.VMReal.logout();
      window.location.href = '/login.html';
    });
  }

  if (refreshBtn) refreshBtn.addEventListener('click', load);

  const init = async () => {
    await window.VMReal.requireMe();
    await load();
  };

  init().catch((e) => {
    console.error(e);
    alert(e.message || 'Error');
  });
})();
