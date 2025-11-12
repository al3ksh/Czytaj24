const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const config = require('./config/env');
const { connectToDatabase } = require('./config/db');

const bookRoutes = require('./routes/bookRoutes');
const cartRoutes = require('./routes/cartRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const infoRoutes = require('./routes/infoRoutes');

const app = express();

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: config.session.secret,
    name: config.session.name,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,
      maxAge: config.session.ttl * 1000,
    },
    store: MongoStore.create({
      mongoUrl: config.mongo.uri,
      dbName: config.mongo.dbName,
      touchAfter: 24 * 3600,
    }),
  })
);

app.use((req, res, next) => {
  res.locals.userName = req.session.userName || null;
  res.locals.userRole = req.session.userRole || null;
  res.locals.filters = {};
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', bookRoutes);
app.use('/', cartRoutes);
app.use('/', authRoutes);
app.use('/', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/', infoRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500);
  if (req.accepts('html')) {
    return res.render('error', { message: 'Coś poszło nie tak.' });
  }
  return res.json({ message: 'Coś poszło nie tak.' });
});

connectToDatabase()
  .then(() => {
    
    if (!config.isProduction && app._router) {
      const routes = [];
      app._router.stack.forEach((layer) => {
        if (layer.route && layer.route.path) {
          const methods = Object.keys(layer.route.methods)
            .filter((m) => layer.route.methods[m])
            .map((m) => m.toUpperCase())
            .join(',');
          routes.push(`${methods} ${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle.stack) {
          layer.handle.stack.forEach((r) => {
            if (r.route && r.route.path) {
              const methods = Object.keys(r.route.methods)
                .filter((m) => r.route.methods[m])
                .map((m) => m.toUpperCase())
                .join(',');
              routes.push(`${methods} ${r.route.path}`);
            }
          });
        }
      });
      console.log('Registered routes (dev):');
      routes.sort().forEach((r) => console.log('  ', r));

      
      app.get('/debug/routes', (req, res) => {
        res.type('text/plain').send(routes.sort().join('\n'));
      });
    }
    app.listen(config.port, () => {
      console.log(`Server ready on port ${config.port}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });

module.exports = app;
