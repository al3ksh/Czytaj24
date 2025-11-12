module.exports = function isAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  
  if (req.session.userRole !== 'admin') {
    return res.status(403).render('error', {
      message: 'Brak uprawnień',
      statusCode: 403,
      details: 'Tylko administratorzy mają dostęp do tego zasobu.'
    });
  }
  
  next();
};
