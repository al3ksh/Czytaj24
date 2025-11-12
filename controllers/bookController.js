const BookRepository = require('../repositories/BookRepository');

const CATEGORIES = ['Edukacja', 'Historyczne', 'Przygodowe', 'Fantasy', 'Kryminal', 'Sci-Fi'];
const LANGUAGES = ['polski', 'angielski'];

exports.getStorefront = async (req, res) => {
  try {
    const filters = {
      category: req.query.category || '',
      language: req.query.language || '',
      search: req.query.search?.trim() || '',
      minPrice: req.query.minPrice || '',
      maxPrice: req.query.maxPrice || '',
      sortBy: req.query.sortBy || 'newest',
    };

    const [collections, books] = await Promise.all([
      BookRepository.getHomepageCollections(),
      BookRepository.findFiltered(filters),
    ]);

    res.render('index', {
      books,
      collections,
      filters,
      categories: CATEGORIES,
      languages: LANGUAGES,
    });
  } catch (error) {
    console.error('Blad pobierania ksiazek:', error);
    res.status(500).render('error', { message: 'Blad pobierania ksiazek' });
  }
};

exports.getBookDetails = async (req, res) => {
  const book = await BookRepository.findById(req.params.id);
  if (!book) {
    return res.status(404).render('error', { message: 'Nie znaleziono ksiazki.' });
  }

  res.render('bookDetails', { book });
};

exports.searchBooks = async (req, res) => {
  try {
    const results = await BookRepository.search(req.query.q || '');
    res.json({ results });
  } catch (error) {
    console.error('Blad wyszukiwania:', error);
    res.status(500).json({ message: 'Nie udalo sie wyszukac ksiazek.' });
  }
};

exports.searchBooksAPI = async (req, res) => {
  try {
    const { search, category, language, minPrice, maxPrice, sortBy, page, limit } = req.query;
    
    const result = await BookRepository.searchBooks({
      search,
      category,
      language,
      minPrice,
      maxPrice,
      sortBy,
      page,
      limit,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Blad wyszukiwania API:', error);
    res.status(500).json({ message: 'Nie udalo sie wyszukac ksiazek.' });
  }
};
