const { ObjectId } = require('mongodb');
const BookRepository = require('../repositories/BookRepository');
const { connectToDatabase } = require('../config/db');

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

const loadBookWithReviews = async (bookId, page = 1, limit = 6) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, parseInt(limit, 10) || 6);
  const skip = (safePage - 1) * safeLimit;

  const [book, reviewsPayload] = await Promise.all([
    BookRepository.findById(bookId),
    (async () => {
      try {
        const db = await connectToDatabase();
        const collection = db.collection('reviews');
        const [items, total] = await Promise.all([
          collection
            .find({ bookId: new ObjectId(bookId) })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .toArray(),
          collection.countDocuments({ bookId: new ObjectId(bookId) }),
        ]);
        return {
          items,
          pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            pages: Math.max(1, Math.ceil(total / safeLimit)),
          },
        };
      } catch (error) {
        return { items: [], pagination: { total: 0, page: safePage, limit: safeLimit, pages: 1 } };
      }
    })(),
  ]);

  return { book, reviews: reviewsPayload.items, reviewPagination: reviewsPayload.pagination };
};

const buildRatingStats = (book, reviews) => {
  const count = Number(book?.ratingCount ?? reviews.length ?? 0);
  const total = Number(book?.ratingTotal ?? 0);

  if (count > 0 && total > 0) {
    return {
      ratingCount: count,
      aggregatedRating: Number((total / count).toFixed(1)),
    };
  }

  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, review) => acc + Number(review.rating || 0), 0);
    return {
      ratingCount: reviews.length,
      aggregatedRating: Number((sum / reviews.length).toFixed(1)),
    };
  }

  return {
    ratingCount: 0,
    aggregatedRating: null,
  };
};

const renderReviewsPartial = (res, payload, status = 200) => {
  res.render('partials/reviewsSection', payload, (err, html) => {
    if (err) {
      return res.status(500).send('');
    }
    return res.status(status).send(html);
  });
};

exports.getBookDetails = async (req, res) => {
  const { book, reviews, reviewPagination } = await loadBookWithReviews(req.params.id, req.query.reviewPage);
  if (!book) {
    return res.status(404).render('error', { message: 'Nie znaleziono ksiazki.' });
  }

  const ratingStats = buildRatingStats(book, reviews);
  res.render('bookDetails', {
    book,
    reviews,
    ratingStats,
    reviewPagination,
    reviewErrors: {},
    editReviewId: req.query.editReviewId || null,
  });
};

exports.getReviewsFragment = async (req, res) => {
  const { book, reviews, reviewPagination } = await loadBookWithReviews(req.params.id, req.query.reviewPage);
  if (!book) {
    return res.status(404).send('');
  }

  const ratingStats = buildRatingStats(book, reviews);
  return renderReviewsPartial(res, {
    book,
    reviews,
    ratingStats,
    reviewPagination,
    reviewErrors: {},
    editReviewId: req.query.editReviewId || null,
    userName: req.session.userName || null,
    userRole: req.session.userRole || null,
    userId: req.session.userId || null,
  });
};

const updateBookRating = async (bookId, nextTotal, nextCount) => {
  const db = await connectToDatabase();
  const aggregatedRating = nextCount > 0 ? Number((nextTotal / nextCount).toFixed(1)) : null;
  await db.collection('books').updateOne(
    { _id: new ObjectId(bookId) },
    {
      $set: {
        ratingTotal: nextTotal,
        ratingCount: nextCount,
        aggregatedRating,
      },
    }
  );
};

const computeRatingTotals = async (bookId) => {
  const db = await connectToDatabase();
  const [stats] = await db.collection('reviews')
    .aggregate([
      { $match: { bookId: new ObjectId(bookId) } },
      { $group: { _id: '$bookId', total: { $sum: '$rating' }, count: { $sum: 1 } } },
    ])
    .toArray();

  return {
    total: Number(stats?.total ?? 0),
    count: Number(stats?.count ?? 0),
  };
};

exports.createReview = async (req, res) => {
  try {
    const { id } = req.params;
    const rating = Number(req.body.rating);
    const comment = (req.body.comment || '').trim();
    const errors = {};

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      errors.rating = 'Wybierz ocenę od 1 do 5.';
    }
    if (!comment) {
      errors.comment = 'Komentarz jest wymagany.';
    }

    const { book, reviews, reviewPagination } = await loadBookWithReviews(id, req.query.reviewPage);
    if (!book) {
      return res.status(404).render('error', { message: 'Nie znaleziono ksiazki.' });
    }

    if (Object.keys(errors).length > 0) {
      const ratingStats = buildRatingStats(book, reviews);
      if (req.xhr) {
        return renderReviewsPartial(res, {
          book,
          reviews,
          ratingStats,
          reviewPagination,
          reviewErrors: errors,
          editReviewId: null,
          userName: req.session.userName || null,
          userRole: req.session.userRole || null,
          userId: req.session.userId || null,
        }, 400);
      }
      return res.status(400).render('bookDetails', {
        book,
        reviews,
        ratingStats,
        reviewPagination,
        reviewErrors: errors,
        editReviewId: null,
      });
    }

    const db = await connectToDatabase();
    const review = {
      bookId: new ObjectId(id),
      userId: new ObjectId(req.session.userId),
      userName: req.session.userName || 'Użytkownik',
      rating,
      comment,
      createdAt: new Date(),
    };

    await db.collection('reviews').insertOne(review);

    const totals = await computeRatingTotals(id);
    await updateBookRating(id, totals.total, totals.count);

    if (req.xhr) {
      const { reviews: nextReviews, reviewPagination: nextPagination } = await loadBookWithReviews(id, req.query.reviewPage);
      const nextRatingStats = buildRatingStats(book, nextReviews);
      return renderReviewsPartial(res, {
        book,
        reviews: nextReviews,
        ratingStats: nextRatingStats,
        reviewPagination: nextPagination,
        reviewErrors: {},
        editReviewId: null,
        userName: req.session.userName || null,
        userRole: req.session.userRole || null,
        userId: req.session.userId || null,
      });
    }
    res.redirect(`/book/${id}`);
  } catch (error) {
    console.error('Blad dodawania opinii:', error);
    res.status(500).render('error', { message: 'Nie udalo sie dodac opinii.' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { bookId, reviewId } = req.params;
    const db = await connectToDatabase();

    const review = await db.collection('reviews').findOne({ _id: new ObjectId(reviewId) });
    if (!review) {
      return res.status(404).render('error', { message: 'Nie znaleziono opinii.' });
    }

    const isOwner = String(review.userId) === String(req.session.userId);
    const isAdmin = req.session.userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).render('error', { message: 'Brak uprawnień.' });
    }

    await db.collection('reviews').deleteOne({ _id: new ObjectId(reviewId) });

    const totals = await computeRatingTotals(bookId);
    await updateBookRating(bookId, totals.total, totals.count);

    if (req.xhr) {
      const { book, reviews: nextReviews, reviewPagination: nextPagination } = await loadBookWithReviews(bookId, req.query.reviewPage);
      if (!book) {
        return res.status(404).send('');
      }
      const nextRatingStats = buildRatingStats(book, nextReviews);
      return renderReviewsPartial(res, {
        book,
        reviews: nextReviews,
        ratingStats: nextRatingStats,
        reviewPagination: nextPagination,
        reviewErrors: {},
        editReviewId: null,
        userName: req.session.userName || null,
        userRole: req.session.userRole || null,
        userId: req.session.userId || null,
      });
    }
    res.redirect(`/book/${bookId}`);
  } catch (error) {
    console.error('Blad usuwania opinii:', error);
    res.status(500).render('error', { message: 'Nie udalo sie usunac opinii.' });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { bookId, reviewId } = req.params;
    const rating = Number(req.body.rating);
    const comment = (req.body.comment || '').trim();
    const errors = {};

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      errors.rating = 'Wybierz ocenę od 1 do 5.';
    }
    if (!comment) {
      errors.comment = 'Komentarz jest wymagany.';
    }

    const db = await connectToDatabase();
    const review = await db.collection('reviews').findOne({ _id: new ObjectId(reviewId) });
    if (!review) {
      return res.status(404).render('error', { message: 'Nie znaleziono opinii.' });
    }

    const isOwner = String(review.userId) === String(req.session.userId);
    const isAdmin = req.session.userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).render('error', { message: 'Brak uprawnień.' });
    }

    if (Object.keys(errors).length > 0) {
      const { book, reviews, reviewPagination } = await loadBookWithReviews(bookId, req.query.reviewPage);
      if (!book) {
        return res.status(404).render('error', { message: 'Nie znaleziono ksiazki.' });
      }
      const ratingStats = buildRatingStats(book, reviews);
      if (req.xhr) {
        return renderReviewsPartial(res, {
          book,
          reviews,
          ratingStats,
          reviewPagination,
          reviewErrors: { ...errors, reviewId },
          editReviewId: reviewId,
          userName: req.session.userName || null,
          userRole: req.session.userRole || null,
          userId: req.session.userId || null,
        }, 400);
      }
      return res.status(400).render('bookDetails', {
        book,
        reviews,
        ratingStats,
        reviewPagination,
        reviewErrors: { ...errors, reviewId },
        editReviewId: reviewId,
      });
    }

    await db.collection('reviews').updateOne(
      { _id: new ObjectId(reviewId) },
      {
        $set: {
          rating,
          comment,
          updatedAt: new Date(),
        },
      }
    );

    const totals = await computeRatingTotals(bookId);
    await updateBookRating(bookId, totals.total, totals.count);

    if (req.xhr) {
      const { book, reviews: nextReviews, reviewPagination: nextPagination } = await loadBookWithReviews(bookId, req.query.reviewPage);
      if (!book) {
        return res.status(404).send('');
      }
      const nextRatingStats = buildRatingStats(book, nextReviews);
      return renderReviewsPartial(res, {
        book,
        reviews: nextReviews,
        ratingStats: nextRatingStats,
        reviewPagination: nextPagination,
        reviewErrors: {},
        editReviewId: null,
        userName: req.session.userName || null,
        userRole: req.session.userRole || null,
        userId: req.session.userId || null,
      });
    }
    res.redirect(`/book/${bookId}`);
  } catch (error) {
    console.error('Blad edycji opinii:', error);
    res.status(500).render('error', { message: 'Nie udalo sie zaktualizowac opinii.' });
  }
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
