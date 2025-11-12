const express = require('express');
const router = express.Router();

router.get('/about', (req, res) => {
  res.render('info/about');
});

router.get('/privacy', (req, res) => {
  res.render('info/privacy');
});

router.get('/terms', (req, res) => {
  res.render('info/terms');
});

module.exports = router;
