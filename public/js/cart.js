(() => {
  const toast = window.CzytajToast || (() => {});

  document.querySelectorAll('.cart-action').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const endpoint = form.dataset.endpoint || form.getAttribute('action') || form.action;
      const formData = new URLSearchParams(new FormData(form));

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        const isJson = response.headers.get('content-type')?.includes('application/json');
        const payload = isJson ? await response.json() : {};

        if (!response.ok) {
          throw new Error(payload.message || 'Nie udało się zaktualizować koszyka.');
        }

        toast(payload.message || 'Koszyk zaktualizowany.');
        window.location.reload();
      } catch (error) {
        toast(error.message || 'Nie udało się zaktualizować koszyka.', 'error');
      }
    });
  });
})();
