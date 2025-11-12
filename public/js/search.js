
(function () {
  const searchInput = document.getElementById('nav-search-input');
  const filterForm = document.getElementById('filter-form');
  const categorySelect = document.getElementById('category');
  const languageSelect = document.getElementById('language');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  const sortBySelect = document.getElementById('sortBy');
  const resultsContainer = document.getElementById('search-results-container');
  const loadingIndicator = document.getElementById('search-loading');
  const clearFiltersBtn = document.getElementById('clear-filters');

  if (!resultsContainer) return;

  let debounceTimer;
  let currentPage = 1;

  const debounce = (fn, delay = 300) => {
    return (...args) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fn(...args), delay);
    };
  };

  async function performSearch(page = 1) {
    currentPage = page;
    const params = new URLSearchParams({
      search: (searchInput?.value || '').trim(),
      category: categorySelect?.value || '',
      language: languageSelect?.value || '',
      minPrice: minPriceInput?.value || '',
      maxPrice: maxPriceInput?.value || '',
      sortBy: sortBySelect?.value || 'newest',
      page: page.toString(),
      limit: '12',
    });

    
    for (const [key, value] of [...params.entries()]) {
      if (!value) params.delete(key);
    }

    showLoading(true);

    try {
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Błąd wyszukiwania' }));
        throw new Error(errorData.message || 'Błąd wyszukiwania');
      }
      const data = await response.json();
      renderResults(data);
    } catch (error) {
      console.error('Błąd wyszukiwania:', error);
      resultsContainer.innerHTML = `
        <div class="col-span-full rounded-2xl border border-rose-300/40 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-200">
          <p><strong>Błąd:</strong> ${error.message}</p>
          <p class="mt-1 text-xs">Spróbuj ponownie za chwilę lub odśwież stronę.</p>
        </div>
      `;
    } finally {
      showLoading(false);
    }
  }

  function renderResults(data) {
    const { items, pagination } = data;

    if (!items || items.length === 0) {
      resultsContainer.innerHTML = `
        <div class="col-span-full glass-panel p-8 text-center text-slate-900 dark:text-slate-100">
          <p class="text-lg font-semibold">Brak wyników dla wybranych filtrów</p>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-300">Spróbuj zmienić zakres cenowy lub kategorię.</p>
        </div>
      `;
      return;
    }

    const booksHTML = items.map((book) => {
      const price = Number(book.discountedPrice ?? book.price ?? 0).toFixed(2);
      const basePrice = Number(book.price ?? price).toFixed(2);
      const rating = (book.aggregatedRating ?? 4.7).toFixed(1);
      const hasDiscount = book.discountedPrice && book.discountedPrice < book.price;
      
      return `
        <div class="glass-panel flex flex-col gap-4 p-6">
          <div class="flex items-start justify-between">
            <span class="badge bg-brand-muted/60 text-brand-dark dark:text-amber-200 text-xs tracking-wide">
              ${book.category || 'Literatura'}
            </span>
            ${book.discountPercent ? `
              <span class="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                -${book.discountPercent}%
              </span>
            ` : book.isNew ? `
              <span class="badge bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">Nowość</span>
            ` : ''}
          </div>

          <div>
            <h3 class="font-display text-lg text-slate-900 dark:text-white">${book.title}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">by ${book.author}</p>
          </div>

          <div class="flex items-center gap-2 text-sm text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.88.99 6.85L12 17.77 6.01 21l.99-6.85-5-4.88 6.91-1.01z" />
            </svg>
            <span class="font-semibold">${rating}</span>
            <span class="text-slate-400">•</span>
            <span class="uppercase text-slate-500 dark:text-slate-400">${book.language === 'angielski' ? 'EN' : 'PL'}</span>
          </div>

          <p class="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
            ${book.description || 'Wyjątkowa pozycja dla wymagających czytelników.'}
          </p>

          ${book.badges && book.badges.length ? `
            <div class="flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-300">
              ${book.badges.map(badge => `
                <span class="badge bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-200">${badge}</span>
              `).join('')}
            </div>
          ` : ''}

          <div class="flex items-baseline gap-3">
            <span class="text-2xl font-semibold text-slate-900 dark:text-white">${price} PLN</span>
            ${hasDiscount ? `<span class="text-sm text-slate-400 line-through">${basePrice} PLN</span>` : ''}
          </div>

          <div class="mt-auto flex flex-wrap gap-3 text-sm">
            <a
              href="/book/${book._id}"
              class="flex-1 rounded-full border border-slate-200 px-4 py-2 text-center font-medium text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-100"
            >
              Szczegóły
            </a>
            ${book.stock > 0 ? `
              <form method="POST" action="/cart" class="add-to-cart-form flex-1" data-book-id="${book._id}">
                <input type="hidden" name="bookId" value="${book._id}" />
                <input type="hidden" name="quantity" value="1" />
                <button
                  type="submit"
                  class="w-full rounded-full bg-brand px-4 py-2 font-semibold text-white shadow transition hover:bg-brand-dark"
                >
                  Dodaj
                </button>
              </form>
            ` : `
              <span class="flex-1 rounded-full bg-rose-50 px-4 py-2 text-center font-medium text-rose-600 dark:bg-rose-500/20 dark:text-rose-200">
                Brak na stanie
              </span>
            `}
          </div>
        </div>
      `;
    }).join('');

    const paginationHTML = renderPagination(pagination);

    resultsContainer.innerHTML = booksHTML;
    
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) {
      paginationContainer.innerHTML = paginationHTML;
    }

    
    attachCartHandlers();
  }

  function renderPagination(pagination) {
    if (pagination.pages <= 1) return '';

    const { page, pages } = pagination;
    let html = '<div class="mt-10 flex items-center justify-center gap-2">';


    if (page > 1) {
      html += `<button onclick="window.smoothSearch.goToPage(${page - 1})" class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-brand">← Poprzednia</button>`;
    }


    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(pages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      if (i === page) {
        html += `<button class="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">${i}</button>`;
      } else {
        html += `<button onclick="window.smoothSearch.goToPage(${i})" class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-brand">${i}</button>`;
      }
    }


    if (page < pages) {
      html += `<button onclick="window.smoothSearch.goToPage(${page + 1})" class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-brand">Następna →</button>`;
    }

    html += '</div>';
    return html;
  }

  function showLoading(show) {
    if (loadingIndicator) {
      loadingIndicator.style.display = show ? 'block' : 'none';
    }
    if (resultsContainer) {
      resultsContainer.style.opacity = show ? '0.5' : '1';
    }
  }

  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => performSearch(1), 300));
    
    
    const navForm = searchInput.closest('form');
    if (navForm) {
      navForm.addEventListener('submit', (e) => {
        e.preventDefault();
        performSearch(1);
      });
    }
  }

  
  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      performSearch(1);
    });
  }

  
  [categorySelect, languageSelect, sortBySelect].forEach((el) => {
    if (el) {
      el.addEventListener('change', () => performSearch(1));
    }
  });

  
  [minPriceInput, maxPriceInput].forEach((el) => {
    if (el) {
      el.addEventListener('input', debounce(() => performSearch(1), 500));
    }
  });

  
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categorySelect) categorySelect.value = '';
      if (languageSelect) languageSelect.value = '';
      if (minPriceInput) minPriceInput.value = '';
      if (maxPriceInput) maxPriceInput.value = '';
      if (sortBySelect) sortBySelect.value = 'newest';
      performSearch(1);
    });
  }

  
  function attachCartHandlers() {
    const forms = resultsContainer.querySelectorAll('.add-to-cart-form');
    forms.forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const bookId = form.querySelector('input[name="bookId"]').value;
        const quantity = form.querySelector('input[name="quantity"]').value;
        const button = form.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        
        try {
          button.disabled = true;
          button.textContent = '...';
          
          const response = await fetch('/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `bookId=${bookId}&quantity=${quantity}`,
          });
          
          const data = await response.json();
          
          if (response.ok) {
            
            if (window.CzytajToast) {
              window.CzytajToast(data.message || 'Dodano do koszyka.');
            }
            button.textContent = originalText;
            button.disabled = false;
          } else {
            
            if (window.CzytajToast) {
              window.CzytajToast(data.message || 'Wystąpił błąd', 'error');
            }
            button.textContent = originalText;
            button.disabled = false;
          }
        } catch (error) {
          console.error('Błąd dodawania do koszyka:', error);
          if (window.CzytajToast) {
            window.CzytajToast('Nie udało się dodać do koszyka', 'error');
          }
          button.textContent = originalText;
          button.disabled = false;
        }
      });
    });
  }

  
  window.smoothSearch = {
    goToPage: (page) => {
      performSearch(page);
      const listingSection = document.getElementById('listing');
      if (listingSection) {
        listingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
  };

  
  performSearch(1);
})();
