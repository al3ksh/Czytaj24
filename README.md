# Czytaj24

Czytaj24 is an e-commerce bookstore built with Node.js/Express and MongoDB, featuring smooth AJAX search, cart and orders, auth with profiles, an admin panel, and a responsive EJS + Tailwind UI.

## Features
- Live search (AJAX) with filters for category, language, price range, and sorting
- Product cards consistent with server-rendered views, pagination without page reloads
- Cart (add, update quantity, remove) and orders flow
- Sign up / login, user profile, route protection (guestOnly, auth)
- Admin panel (manage books and orders) with polished action modals
- Rate limiting for login, register, and search with friendly error handling
- Responsive UI: EJS + Tailwind CSS, dark mode, subtle glass look

## Tech Stack
- Backend: Node.js, Express, EJS
- Database: MongoDB (official driver), sessions via connect-mongo
- Frontend: Tailwind CSS, vanilla JS (fetch, debounce)
- Security & performance: helmet, compression, express-rate-limit

## Requirements
- Node.js 18+
- MongoDB (local or hosted)

## Environment Setup
Create a `.env` file in the project root:

```
NODE_ENV=development
PORT=3000

MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=czytaj24

SESSION_SECRET=super_secret_value
SESSION_NAME=sid
SESSION_TTL=86400
```

Required vars: `MONGO_URI`, `MONGO_DB_NAME`, `SESSION_SECRET` (validated at startup in `config/env.js`).

## Quick Start
1) Install dependencies
```
npm install
```
2) Build CSS (runs in postinstall as well)
```
npm run build:css
```
3) Start the server
```
npm start
```
The app will start on `PORT` (default 3000).

## NPM Scripts
- `npm start` – start Express server
- `npm run dev:css` – Tailwind watch (during UI work)
- `npm run build:css` – build Tailwind (minified)
- Seeders:
  - `npm run seed` / `npm run seed:all` – seed sample data
  - `npm run seed:books` / `npm run seed:users` – seed books/users only
  - `npm run wipe:books` / `npm run wipe:all` – wipe data
  - `npm run make-admin` – promote a user to admin

## Folder Structure (short)
```
config/        # env, Mongo connection
controllers/   # route logic (books, cart, auth, order, admin)
middleware/    # auth, rate limiters, isAdmin, error
models/        # models (cart, order, user, book)
public/        # static assets (css/js)
  js/          # storefront, search, cart, admin
repositories/  # data access (BookRepository)

views/         # EJS templates (partials, admin, pages)
```

## Dev Tips
- UI uses Tailwind – run `npm run dev:css` while styling
- Dev mode exposes `/debug/routes` and logs routes on start
- No client-side framework – vanilla JS + fetch returning JSON/HTML

## License
ISC (see `package.json`).
