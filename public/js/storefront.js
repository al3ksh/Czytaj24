(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const themeToggleMobile = document.querySelector('[data-theme-toggle-mobile]');
  const storageKey = 'czytaj24-theme';

  const updateToggleState = (toggle, theme) => {
    if (!toggle) return;
    const isDark = theme === 'dark';
    toggle.textContent = isDark ? 'Tryb jasny' : 'Tryb ciemny';
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', isDark ? 'Włącz tryb jasny' : 'Włącz tryb ciemny');
  };

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(storageKey, theme);
    updateToggleState(themeToggle, theme);
    updateToggleState(themeToggleMobile, theme);
  };

  applyTheme(root.dataset.theme || localStorage.getItem(storageKey) || 'light');

  themeToggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  themeToggleMobile?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  mobileMenuToggle?.addEventListener('click', () => {
    const isHidden = mobileMenu.classList.contains('hidden');
    if (isHidden) {
      mobileMenu.classList.remove('hidden');
      mobileMenuToggle.innerHTML = '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
      mobileMenuToggle.setAttribute('aria-label', 'Zamknij menu');
    } else {
      mobileMenu.classList.add('hidden');
      mobileMenuToggle.innerHTML = '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>';
      mobileMenuToggle.setAttribute('aria-label', 'Menu');
    }
  });

  const clearButton = document.getElementById('clear-filters');
  clearButton?.addEventListener('click', () => {
    window.location.href = '/';
  });

  const toastEl = document.getElementById('toast');
  let toastTimeout;
  const showToast = (message, variant = 'success') => {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.style.backgroundColor = variant === 'error' ? '#dc2626' : '#0f172a';
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 2800);
  };

  window.CzytajToast = showToast;

  document.querySelectorAll('.add-to-cart-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new URLSearchParams(new FormData(form));

      try {
        const response = await fetch('/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        if (response.redirected) {
          window.location.href = response.url;
          return;
        }

        const isJson = response.headers.get('content-type')?.includes('application/json');
        const payload = isJson ? await response.json() : {};

        if (!response.ok) {
          throw new Error(payload.message || 'Nie udało się dodać do koszyka.');
        }

        showToast(payload.message || 'Dodano do koszyka.');
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  });

  const searchInput = document.getElementById('nav-search-input');
  const suggestions = document.getElementById('search-suggestions');
  let debounce;

  const renderSuggestions = (items = []) => {
    if (!suggestions) return;
    if (!items.length) {
      suggestions.classList.add('hidden');
      suggestions.innerHTML = '';
      return;
    }

    suggestions.innerHTML = items
      .map(
        (item) => `
        <a
          href="/book/${item._id}"
          class="flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/5"
        >
          <span>
            <span class="font-medium">${item.title}</span>
            <span class="ml-1 text-xs text-slate-500 dark:text-slate-400">(${item.author || 'Autor nieznany'})</span>
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400">${Number(item.price || 0).toFixed(2)} PLN</span>
        </a>
      `
      )
      .join('');

    suggestions.classList.remove('hidden');
  };

  searchInput?.addEventListener('input', () => {
    const term = searchInput.value.trim();
    clearTimeout(debounce);

    if (!term) {
      renderSuggestions([]);
      return;
    }

    debounce = setTimeout(async () => {
      try {
        const response = await fetch(`/search?q=${encodeURIComponent(term)}`);
        if (!response.ok) {
          renderSuggestions([]);
          return;
        }
        const { results } = await response.json();
        renderSuggestions(results || []);
      } catch {
        renderSuggestions([]);
      }
    }, 200);
  });

  searchInput?.addEventListener('blur', () => {
    setTimeout(() => renderSuggestions([]), 200);
  });
})();
