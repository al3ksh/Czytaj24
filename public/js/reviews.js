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
    reviewsSection.querySelectorAll('[data-rating-group]').forEach((group) => {
      const inputs = group.querySelectorAll('input[type="radio"][name="rating"]');
      const output = group.querySelector('[data-rating-output]');

      const updateStars = (value) => {
        group.querySelectorAll('[data-star]').forEach((label) => {
          const starValue = Number(label.dataset.star || 0);
          const icon = label.querySelector('[data-star-icon]');
          if (!icon) return;
          if (starValue <= value) {
            icon.classList.add('text-amber-500');
            icon.classList.remove('text-slate-300');
            icon.classList.remove('dark:text-slate-600');
          } else {
            icon.classList.remove('text-amber-500');
            icon.classList.add('text-slate-300');
            icon.classList.add('dark:text-slate-600');
          }
        });

        if (output) {
          output.textContent = value ? `${value}/5` : '';
        }
      };

      const current = group.querySelector('input[type="radio"][name="rating"]:checked');
      updateStars(current ? Number(current.value) : 0);

      inputs.forEach((input) => {
        input.addEventListener('change', () => updateStars(Number(input.value)));
      });
    });

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
