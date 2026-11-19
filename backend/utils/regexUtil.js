/**
 * Safely escapes regular expression special characters in user input
 * to prevent ReDoS (Regular Expression Denial of Service) and regex injection.
 */
const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { escapeRegex };
