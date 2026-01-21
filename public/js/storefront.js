(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const themeToggleMobile = document.querySelector('[data-theme-toggle-mobile]');
  const storageKey = 'czytaj24-theme';

  const updateToggleState = (toggle, theme) => {
    if (!toggle) return;
    const isDark = theme === 'dark';
    const label = toggle.querySelector('[data-theme-label]');
    const icon = toggle.querySelector('[data-theme-icon]');
    if (label) {
      label.textContent = isDark ? 'LIGHT' : 'DARK';
    } else {
      toggle.textContent = isDark ? 'LIGHT' : 'DARK';
    }
    if (icon) {
      icon.textContent = isDark ? '☀️' : '🌙';
    }
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

  const url = new URL(window.location.href);
  const errorMessage = url.searchParams.get('error');
  const successMessage = url.searchParams.get('success');
  if (errorMessage || successMessage) {
    showToast(errorMessage || successMessage, errorMessage ? 'error' : 'success');
    url.searchParams.delete('error');
    url.searchParams.delete('success');
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
  }

  const collapsibles = document.querySelectorAll('[data-collapsible]');
  if (collapsibles.length) {
    const setState = (wrapper, open, immediate = false) => {
      const content = wrapper.querySelector('[data-collapsible-content]');
      const toggle = wrapper.querySelector('[data-collapsible-toggle]');
      const label = wrapper.querySelector('[data-collapsible-label]');
      const icon = wrapper.querySelector('[data-collapsible-icon]');

      if (!content || !toggle) return;

      if (immediate) {
        content.style.transition = 'none';
      } else {
        content.style.transition = '';
      }

      if (open) {
        content.style.maxHeight = `${content.scrollHeight}px`;
        content.style.opacity = '1';
        content.style.pointerEvents = 'auto';
        if (icon) icon.classList.add('rotate-180');
      } else {
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
        content.style.pointerEvents = 'none';
        if (icon) icon.classList.remove('rotate-180');
      }

      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (label) label.textContent = open ? 'Zwiń' : 'Rozwiń';
    };

    collapsibles.forEach((wrapper) => {
      const content = wrapper.querySelector('[data-collapsible-content]');
      const toggle = wrapper.querySelector('[data-collapsible-toggle]');
      const id = wrapper.dataset.collapsibleId || 'section';
      const storageKey = `czytaj24-collapsible:${id}`;

      if (!content || !toggle) return;

      const saved = localStorage.getItem(storageKey);
      const open = saved ? saved === 'open' : true;
      setState(wrapper, open, true);

      requestAnimationFrame(() => {
        setState(wrapper, open);
      });

      toggle.addEventListener('click', () => {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        const nextOpen = !isOpen;
        setState(wrapper, nextOpen);
        localStorage.setItem(storageKey, nextOpen ? 'open' : 'closed');
      });

      window.addEventListener('resize', () => {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          content.style.maxHeight = `${content.scrollHeight}px`;
        }
      });
    });
  }

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
