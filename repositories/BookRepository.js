const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../config/db');

class BookRepository {
  static async collection() {
    const db = await connectToDatabase();
    return db.collection('books');
  }

  static buildQuery(filters = {}) {
    const query = { isActive: { $ne: false } };

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.language) {
      query.language = filters.language;
    }

    const minPrice = filters.minPrice !== '' ? Number(filters.minPrice) : undefined;
    const maxPrice = filters.maxPrice !== '' ? Number(filters.maxPrice) : undefined;

    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      const priceCondition = {};
      if (Number.isFinite(minPrice)) {
        priceCondition.$gte = minPrice;
      }
      if (Number.isFinite(maxPrice)) {
        priceCondition.$lte = maxPrice;
      }

      const fallbackCondition = { ...priceCondition };

      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { discountedPrice: priceCondition },
          {
            $and: [
              {
                $or: [
                  { discountedPrice: { $exists: false } },
                  { discountedPrice: null },
                ],
              },
              { price: fallbackCondition },
            ],
          },
        ],
      });
    }

    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: regex },
          { author: regex },
          { description: regex },
          { tags: regex },
        ],
      });
    }

    return query;
  }

  static buildSort(sortBy) {
    switch (sortBy) {
      case 'price-asc':
        return { discountedPrice: 1, price: 1 };
      case 'price-desc':
        return { discountedPrice: -1, price: -1 };
      case 'newest':
        return { publishedAt: -1, createdAt: -1 };
      case 'popular':
        return { popularityScore: -1 };
      default:
        return { publishedAt: -1 };
    }
  }

  static async findFiltered(filters = {}) {
    const collection = await this.collection();
    const query = this.buildQuery(filters);
    const sort = this.buildSort(filters.sortBy);

    return collection.find(query).sort(sort).limit(48).toArray();
  }

  static async getHomepageCollections() {
    const collection = await this.collection();
    const baseQuery = { isActive: { $ne: false } };

    const [newArrivals, promoPicks, topRated, lowStock] = await Promise.all([
      collection.find(baseQuery).sort({ publishedAt: -1 }).limit(8).toArray(),
      collection.find({ ...baseQuery, discountPercent: { $gte: 10 } }).sort({ discountPercent: -1 }).limit(6).toArray(),
      collection.find(baseQuery).sort({ aggregatedRating: -1 }).limit(6).toArray(),
      collection.find({ ...baseQuery, stock: { $lt: 5 } }).sort({ stock: 1 }).limit(6).toArray(),
    ]);

    return {
      newArrivals,
      promoPicks,
      topRated,
      lowStock,
    };
  }

  static async search(term) {
    const trimmed = term?.trim();
    if (!trimmed) return [];
    const collection = await this.collection();
    const regex = new RegExp(trimmed, 'i');
    return collection
      .find({ $or: [{ title: regex }, { author: regex }, { category: regex }] })
      .project({ title: 1, author: 1, price: 1, coverUrl: 1, category: 1 })
      .limit(10)
      .toArray();
  }

  static async searchBooks({ search, category, language, minPrice, maxPrice, sortBy = 'newest', page = 1, limit = 12 }) {
    const collection = await this.collection();
    const filters = { search, category, language, minPrice, maxPrice, sortBy };
    const query = this.buildQuery(filters);
    const sort = this.buildSort(sortBy);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      collection.find(query).sort(sort).skip(skip).limit(limitNum).toArray(),
      collection.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  static async findById(id) {
    const collection = await this.collection();
    try {
      return collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      return null;
    }
  }
}

module.exports = BookRepository;
