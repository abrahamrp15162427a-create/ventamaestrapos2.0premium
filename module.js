(() => {
  const logoutBtn = document.querySelector('[data-logout]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await window.VMReal.logout();
      } finally {
        window.location.href = '/login.html';
      }
    });
  }
})();
