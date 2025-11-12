const { run } = require('./seeders/index');

run('seed')
  .then(() => {
    console.log('Seed zakończony.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Błąd seeda:', error);
    process.exit(1);
  });
