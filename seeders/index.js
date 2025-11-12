const { seedBooks, wipeBooks } = require('./booksSeeder');
const { seedUsers, wipeUsers } = require('./usersSeeder');
const { connectToDatabase } = require('../config/db');

async function wipeOrders() {
  const db = await connectToDatabase();
  const [carts, orders] = await Promise.all([
    db.collection('carts').deleteMany({}),
    db.collection('orders').deleteMany({}),
  ]);
  console.log(`Wyczyszczono ${carts.deletedCount} koszyków i ${orders.deletedCount} zamówień.`);
}

async function wipeAll() {
  await Promise.all([wipeBooks(), wipeUsers(), wipeOrders()]);
  console.log('Wyczyszczono wszystkie kluczowe kolekcje.');
}

async function seedAll() {
  await wipeAll();
  await seedBooks({ skipWipe: true });
  await seedUsers({ skipWipe: true });
  console.log('Zakończono seedowanie bazy.');
}

async function makeAdmin(email) {
  if (!email) {
    console.error('Podaj email użytkownika: npm run make-admin <email>');
    return;
  }
  const db = await connectToDatabase();
  const result = await db.collection('users').updateOne(
    { email: email.toLowerCase() },
    { $set: { role: 'admin' } }
  );
  
  if (result.matchedCount === 0) {
    console.log(`❌ Nie znaleziono użytkownika z emailem: ${email}`);
  } else {
    console.log(`✅ Użytkownik ${email} jest teraz adminem!`);
  }
}

async function run(action = 'seed') {
  switch (action) {
    case 'seed':
    case 'seed:all':
      await seedAll();
      break;
    case 'books':
    case 'seed:books':
      await seedBooks();
      break;
    case 'users':
    case 'seed:users':
      await seedUsers();
      break;
    case 'wipe':
    case 'wipe:all':
      await wipeAll();
      break;
    case 'wipe:books':
      await wipeBooks();
      break;
    case 'wipe:users':
      await wipeUsers();
      break;
    case 'make-admin':
      await makeAdmin(process.argv[3]);
      break;
    default:
      console.log(`Nieznane polecenie "${action}". Dostępne: seed|books|users|wipe|make-admin.`);
  }
}

if (require.main === module) {
  const action = process.argv[2] || 'seed';
  run(action)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Błąd seeda:', error);
      process.exit(1);
    });
}

module.exports = { run, seedAll, seedBooks, seedUsers, wipeAll, makeAdmin };
