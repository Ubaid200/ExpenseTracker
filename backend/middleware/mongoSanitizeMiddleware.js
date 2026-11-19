/**
 * Express 5-compatible NoSQL query injection sanitizer.
 * Recursively strips keys starting with '$' or containing '.'
 * from req.body, req.params, and req.query in place without reassigning getters.
 */
const clean = (obj) => {
  if (!obj || typeof obj !== 'object') return;

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      clean(obj[key]);
    }
  }
};

const sanitizeNoSQL = (req, res, next) => {
  if (req.body && typeof req.body === 'object') clean(req.body);
  if (req.params && typeof req.params === 'object') clean(req.params);
  if (req.query && typeof req.query === 'object') clean(req.query);

  next();
};

module.exports = sanitizeNoSQL;
