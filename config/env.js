const dotenv = require('dotenv');

dotenv.config();

const requiredVars = ['MONGO_URI', 'MONGO_DB_NAME', 'SESSION_SECRET'];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '3000', 10),
  mongo: {
    uri: process.env.MONGO_URI,
    dbName: process.env.MONGO_DB_NAME,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    name: process.env.SESSION_NAME || 'sid',
    ttl: parseInt(process.env.SESSION_TTL || '86400', 10),
  },
};

module.exports = config;
