(() => {
  const reviewsSection = document.getElementById('reviews-section');
  if (!reviewsSection) return;

  const bookId = reviewsSection.dataset.bookId;
  if (!bookId) return;

  const refreshSection = async ({ reviewPage, editReviewId } = {}) => {
    const url = new URL(`/book/${bookId}/reviews/fragment`, window.location.origin);
    if (reviewPage) url.searchParams.set('reviewPage', reviewPage);
    if (editReviewId) url.searchParams.set('editReviewId', editReviewId);

    const response = await fetch(url.toString(), {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });

    const html = await response.text();
    if (!response.ok) {
      throw new Error('Nie udało się odświeżyć opinii.');
    }

    const currentScroll = window.scrollY;
    reviewsSection.innerHTML = html;
    bindInteractions();
    requestAnimationFrame(() => {
      window.scrollTo({ top: currentScroll, behavior: 'auto' });
    });
  };

  const submitForm = async (form) => {
    const action = form.getAttribute('action');
    const method = form.getAttribute('method') || 'POST';
    const formData = new FormData(form);
    const payload = new URLSearchParams();
    formData.forEach((value, key) => {
      payload.append(key, value);
    });

    const response = await fetch(action, {
      method: method.toUpperCase(),
      body: payload,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    });

    const html = await response.text();
    const currentScroll = window.scrollY;
    reviewsSection.innerHTML = html;
    bindInteractions();
    requestAnimationFrame(() => {
      window.scrollTo({ top: currentScroll, behavior: 'auto' });
    });
  };

  const bindInteractions = () => {
    reviewsSection.querySelectorAll('form[data-review-form]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitForm(form);
      });
    });

    reviewsSection.querySelectorAll('a[data-review-link]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const reviewPage = link.dataset.reviewPage || undefined;
        const editReviewId = link.dataset.editReviewId || undefined;
        refreshSection({ reviewPage, editReviewId });
      });
    });
  };

  bindInteractions();
})();
