const rateLimit = require('express-rate-limit');


const MAX_LOGIN_ATTEMPTS = 15; 
const MAX_REGISTER_ATTEMPTS = 8; 
const MAX_SEARCH_REQUESTS = 100; 


const renderLimitReached = (view) => (req, res, _next, options) => {
  const message = typeof options.message === 'string'
    ? options.message
    : 'Zbyt wiele prób. Spróbuj ponownie później.';

  
  const values = {
    name: req.body?.name || '',
    email: req.body?.email || '',
  };


  if (req.accepts('html')) {
    return res.status(429).render(view, {
      errors: { general: message },
      values,
    });
  }

  
  return res.status(429).json({ message });
};



const { ipKeyGenerator } = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: MAX_LOGIN_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  
  skipSuccessfulRequests: true,
  keyGenerator: (req, _res) => `${ipKeyGenerator(req)}:login:${(req.body?.email || '').toLowerCase()}`,
  message: 'Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut.',
  handler: renderLimitReached('login'),
});

const registerLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, 
  max: MAX_REGISTER_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req, _res) => `${ipKeyGenerator(req)}:register:${(req.body?.email || '').toLowerCase()}`,
  message: 'Zbyt wiele prób rejestracji. Spróbuj ponownie za kilka minut.',
  handler: renderLimitReached('register'),
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: MAX_SEARCH_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, 
  message: 'Zbyt wiele zapytań wyszukiwania. Zwolnij i spróbuj ponownie za chwilę.',
  handler: (req, res, _next, options) => {
    const message = options.message || 'Zbyt wiele zapytań wyszukiwania.';
    
    if (req.path.includes('/api/')) {
      return res.status(429).json({ 
        message,
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    }
    
    return res.status(429).json({ message });
  },
});

module.exports = {
  
  
  authLimiter: loginLimiter,
  loginLimiter,
  registerLimiter,
  searchLimiter,
};
