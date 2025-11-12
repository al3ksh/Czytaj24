(() => {
  const toast = window.CzytajToast || (() => {});

  const formatSeconds = (seconds) => Math.max(0, seconds);

  document.querySelectorAll('[data-order-id]').forEach((card) => {
    const status = card.dataset.status;
    const deadline = Number(card.dataset.cancelDeadline);
    if (!deadline || status !== 'pending') return;

    const timerEl = card.querySelector(`[data-timer="${card.dataset.orderId}"]`);
    const actions = card.querySelector('[data-order-actions]');
    const badge = card.querySelector('[data-status-badge]');
    const cancelForm = card.querySelector('[data-cancel-form]');

    if (!timerEl) return;

    const interval = setInterval(() => {
      const secondsLeft = Math.floor((deadline - Date.now()) / 1000);
      if (secondsLeft > 0) {
        timerEl.textContent = formatSeconds(secondsLeft);
        return;
      }

      clearInterval(interval);
      timerEl.textContent = '0';
      if (cancelForm) {
        cancelForm.remove();
      }
      if (badge) {
        badge.textContent = 'Potwierdzone';
        badge.className =
          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide bg-emerald-500/20 text-emerald-200';
      }
      if (actions && !actions.querySelector('.auto-confirm-note')) {
        const note = document.createElement('p');
        note.className = 'auto-confirm-note text-xs text-slate-400';
        note.textContent = 'Czas minął — zamówienie potwierdzone automatycznie.';
        actions.appendChild(note);
      }
      toast('Okno anulacji dobiegło końca.');
    }, 1000);
  });
})();
