const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiters');
const guestOnly = require('../middleware/guestOnly');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/login', guestOnly, (req, res) => res.render('login', { errors: {}, values: {} }));
router.post('/login', guestOnly, loginLimiter, authController.login);

router.get('/register', guestOnly, (req, res) => res.render('register', { errors: {}, values: {} }));
router.post('/register', guestOnly, registerLimiter, authController.register);

router.get('/profil', authMiddleware, authController.profile);
router.post('/profil/haslo', authMiddleware, authController.updatePassword);

router.post('/logout', authController.logout);

module.exports = router;
