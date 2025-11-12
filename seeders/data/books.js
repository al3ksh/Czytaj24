const randomBetween = (min, max) => Math.round(Math.random() * (max - min) + min);

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const withComputedFields = (book) => {
  const now = new Date();
  const publishedAt = book.publishedAt || daysAgo(randomBetween(5, 180));
  const discountPercent = book.discountPercent || 0;
  const discountedPrice = discountPercent
    ? Number((book.price * (1 - discountPercent / 100)).toFixed(2))
    : book.price;

  return {
    ...book,
    discountPercent,
    discountedPrice,
    publishedAt,
    createdAt: now,
    updatedAt: now,
    aggregatedRating: book.aggregatedRating || Number((Math.random() * 0.7 + 4.2).toFixed(1)),
    popularityScore: book.popularityScore || randomBetween(80, 400),
    isNew: book.isNew ?? (now - publishedAt < 1000 * 60 * 60 * 24 * 45),
    isActive: book.isActive ?? true,
  };
};

const booksSeed = () => {
  const books = [
    {
      title: 'Miasto Mgly',
      author: 'Agnieszka Sadowska',
      category: 'Fantasy',
      language: 'polski',
      price: 69.9,
      discountPercent: 15,
      stock: 14,
      tags: ['urban fantasy', 'nowosc'],
      badges: ['Bestseller', 'Nowosc'],
      description: 'Magiczny Gdansk tonie w mglach, a mloda kartografka odkrywa mapy zmieniajace rzeczywistosc.',
    },
    {
      title: 'Archive of Starlit Paths',
      author: 'Lisbeth Moore',
      category: 'Sci-Fi',
      language: 'angielski',
      price: 82.5,
      discountPercent: 20,
      stock: 9,
      tags: ['space opera', 'ai'],
      badges: ['Promo'],
      description: 'Zaloga Archiwum sciga sie z czasem, katalogujac planety zanim pochlonie je grawitacyjna burza.',
    },
    {
      title: 'Pamietnik smakow',
      author: 'Marta Zielinska',
      category: 'Edukacja',
      language: 'polski',
      price: 54.5,
      stock: 20,
      tags: ['kuchnia', 'esej'],
      badges: ['Audio + eBook'],
      description: 'Historie smakow budujace wspomnienia. Eseje laczace kuchnie, antropologie i design.',
    },
    {
      title: 'Ostatnia prosta',
      author: 'Janusz Kaller',
      category: 'Kryminal',
      language: 'polski',
      price: 46.8,
      stock: 4,
      tags: ['crime', 'retro'],
      badges: ['Low stock'],
      description: 'Sledztwo w realiach powojennej Warszawy odkrywa kulisy pierwszych wyscigow ulicznych.',
    },
    {
      title: 'Atlas Zmyslow',
      author: 'Olivia Grant',
      category: 'Edukacja',
      language: 'angielski',
      price: 91.0,
      discountPercent: 18,
      stock: 6,
      tags: ['popular science'],
      badges: ['Bestseller'],
      description: 'Wizualny przewodnik po neurologii percepcji i projektowaniu doswiadczen wielozmyslowych.',
    },
    {
      title: 'Shelter of Dawn',
      author: 'Marcus Ellison',
      category: 'Fantasy',
      language: 'angielski',
      price: 72.2,
      stock: 11,
      tags: ['epic', 'saga'],
      badges: ['Seria 3/5'],
      description: 'Zaginiona ksiega poranka wraca do stolicy, rozpalajac konflikt pomiedzy rodami straznikow swiatla.',
    },
    {
      title: 'Listy z Atlantydy',
      author: 'Karolina Dabrowska',
      category: 'Historyczne',
      language: 'polski',
      price: 64.0,
      stock: 7,
      tags: ['magiczny realizm', 'morze'],
      badges: ['Nowosc'],
      description: 'Ekspedycja odkrywa listy zapisane w odlamkach szkla, opisujace zycie ocalałych z Atlantydy.',
    },
    {
      title: 'Fale Polnocy',
      author: 'Cezary Pawluk',
      category: 'Przygodowe',
      language: 'polski',
      price: 38.9,
      stock: 18,
      tags: ['podroz', 'zagle'],
      badges: [],
      description: 'Reportazowa opowiesc o samotnym rejsie przez zimne morza i odbudowie relacji z samym soba.',
    },
    {
      title: 'Neonowe sny',
      author: 'Hyejin Park',
      category: 'Sci-Fi',
      language: 'angielski',
      price: 77.7,
      discountPercent: 12,
      stock: 5,
      tags: ['cyberpunk', 'Seul'],
      badges: ['Promocja'],
      description: 'Detektyw neuronawigator sledzi sny mieszkancow Seulu, by odnalezc zrodlo zbiorowego buntu.',
    },
    {
      title: 'Dom na ulicy Wrzosowej',
      author: 'Natalia Grot',
      category: 'Historyczne',
      language: 'polski',
      price: 52.0,
      stock: 3,
      tags: ['obyczaj', 'historia'],
      badges: ['Low stock'],
      description: 'Saga trzech pokolen kobiet prowadzacych ksiegarnie na warszawskim Mokotowie.',
    },
    {
      title: 'Kwantowy ogrod',
      author: 'Dr. Lionel Tse',
      category: 'Sci-Fi',
      language: 'angielski',
      price: 88.8,
      stock: 8,
      discountPercent: 10,
      tags: ['science', 'design'],
      badges: ['Nowosc'],
      description: 'Eksperymentalny ogrod na Marsie zmienia zasady botaniki. Kto tak naprawde nim steruje?',
    },
    {
      title: 'Przepis na cisze',
      author: 'Helena Baran',
      category: 'Przygodowe',
      language: 'polski',
      price: 41.5,
      stock: 16,
      tags: ['slow life', 'gory'],
      badges: [],
      description: 'Podroz przez beskidzkie schroniska, gdzie dzwiek prowadzi do glebszej uwaznosci.',
    },
  ];

  return books.map(withComputedFields);
};

module.exports = booksSeed;
