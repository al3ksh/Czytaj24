const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const { connectToDatabase } = require('../config/db');

const DEMO_PASSWORD = process.env.SEED_USER_PASSWORD || 'Czytaj24!';

async function wipeUsers() {
  const db = await connectToDatabase();
  const result = await db.collection('users').deleteMany({});
  console.log(`Usunięto ${result.deletedCount} użytkowników.`);
}

const buildUser = (overrides = {}) => ({
  ...overrides,
  createdAt: new Date(),
  updatedAt: new Date(),
  isVerified: true,
});

async function seedUsers({ skipWipe = false, count = 8 } = {}) {
  if (!skipWipe) {
    await wipeUsers();
  }

  const db = await connectToDatabase();
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const baseUsers = [
    buildUser({
      name: 'Admin Czytaj24',
      email: 'admin@czytaj24.pl',
      role: 'admin',
      password: hashedPassword,
    }),
    buildUser({
      name: 'Maja Portfolio',
      email: 'maja@czytaj24.pl',
      role: 'customer',
      password: hashedPassword,
    }),
  ];

  const fakeUsers = Array.from({ length: count }).map(() =>
    buildUser({
      name: faker.person.fullName(),
      email: faker.helpers.unique(() => faker.internet.email({ provider: 'czytaj24.pl' })).toLowerCase(),
      role: 'customer',
      password: hashedPassword,
      preferences: {
        favoriteCategory: faker.helpers.arrayElement(['Fantasy', 'Edukacja', 'Przygodowe', 'Historyczne', 'Sci-Fi']),
      },
    })
  );

  const users = [...baseUsers, ...fakeUsers];
  await db.collection('users').insertMany(users);
  console.log(`Zasiano ${users.length} użytkowników. Hasło demo: ${DEMO_PASSWORD}`);
  return users.length;
}

module.exports = { seedUsers, wipeUsers, DEMO_PASSWORD };
