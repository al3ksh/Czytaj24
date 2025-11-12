(() => {
  const PLN = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });

  const modal = document.getElementById('adminOrderModal');
  const content = document.getElementById('adminOrderModalContent');
  const closeBtn = document.getElementById('adminOrderModalClose');
  const okBtn = document.getElementById('adminOrderModalOk');
  const backdrop = document.getElementById('adminOrderModalBackdrop');

  function openModal() {
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  
  function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', closeModal);
  okBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.order-details-btn');
    if (!btn) return;
    const json = btn.getAttribute('data-order');
    if (!json) return;
    let data;
    try { data = JSON.parse(json); } catch { return; }

    const itemsHtml = (data.items || [])
      .map(i => `<li class='flex justify-between'><span>${i.title} × ${i.quantity}</span><span>${PLN.format(i.price * i.quantity)}</span></li>`)
      .join('');

    const when = data.date ? new Date(data.date) : null;
    const pay = data.paymentMethod === 'card'
      ? `Karta ${data.paymentLast4 ? '(****' + data.paymentLast4 + ')' : ''}`
      : data.paymentMethod === 'blik' ? 'BLIK'
      : data.paymentMethod === 'cash' ? 'Gotówka przy odbiorze'
      : (data.paymentMethod || '—');

    const deliveryLine = data.delivery ? `${data.delivery} (${PLN.format(data.deliveryCost || 0)})` : '—';

    content.innerHTML = `
      <div class='grid gap-4 md:grid-cols-2'>
        <div>
          <div class='text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400'>ID</div>
          <div class='font-mono text-sm text-slate-800 dark:text-slate-200'>${String(data.id).slice(-24)}</div>
          ${when ? `<div class='text-xs text-slate-500 dark:text-slate-400'>${when.toLocaleDateString('pl-PL')} ${when.toLocaleTimeString('pl-PL')}</div>` : ''}
        </div>
        <div>
          <div class='text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400'>Klient</div>
          <div class='text-sm text-slate-800 dark:text-slate-200'>${data.customer?.name || '—'}</div>
          <div class='text-xs text-slate-500 dark:text-slate-400'>${data.customer?.phone || ''}</div>
        </div>
        <div>
          <div class='text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400'>Adres</div>
          <div class='text-sm text-slate-800 dark:text-slate-200'>${data.customer?.address?.street || '—'}<br>${data.customer?.address?.postalCode || ''} ${data.customer?.address?.city || ''}</div>
        </div>
        <div>
          <div class='text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400'>Dostawa / Płatność</div>
          <div class='text-sm text-slate-800 dark:text-slate-200'>Dostawa: ${deliveryLine}</div>
          <div class='text-sm text-slate-800 dark:text-slate-200'>Płatność: ${pay}</div>
        </div>
      </div>
      <hr class='my-4 border-slate-200 dark:border-slate-700'/>
      <div>
        <div class='mb-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400'>Pozycje</div>
        <ul class='space-y-1'>${itemsHtml || `<li class='text-slate-500 dark:text-slate-400'>Brak pozycji</li>`}</ul>
        <div class='mt-4 flex justify-end gap-6 text-sm'>
          <div class='text-slate-600 dark:text-slate-400'>Razem:</div>
          <div class='font-semibold text-slate-900 dark:text-slate-100'>${PLN.format(data.total || 0)}</div>
        </div>
      </div>
    `;
    openModal();
  });

  
  const confirmModal = document.getElementById('confirmDeleteModal');
  const confirmBackdrop = document.getElementById('confirmDeleteBackdrop');
  const confirmCancel = document.getElementById('confirmDeleteCancel');
  const confirmOk = document.getElementById('confirmDeleteOk');
  const confirmTitle = document.getElementById('confirmDeleteTitle');
  let pendingDeleteForm = null;

  function openConfirmModal(titleText) {
    if (!confirmModal) return;
    if (confirmTitle) confirmTitle.textContent = `To działanie jest nieodwracalne. Usunąć: "${titleText}"?`;
    confirmModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeConfirmModal() {
    if (!confirmModal) return;
    confirmModal.style.display = 'none';
    document.body.style.overflow = '';
    pendingDeleteForm = null;
  }

  confirmBackdrop?.addEventListener('click', closeConfirmModal);
  confirmCancel?.addEventListener('click', closeConfirmModal);
  confirmOk?.addEventListener('click', () => {
    if (!pendingDeleteForm) return closeConfirmModal();
    
    pendingDeleteForm.submit();
    pendingDeleteForm = null;
    closeConfirmModal();
  });

  document.querySelectorAll('.delete-book-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      
      e.preventDefault();
      pendingDeleteForm = form;
      const title = form.getAttribute('data-title') || 'tę książkę';
      openConfirmModal(title);
    });
  });
})();
