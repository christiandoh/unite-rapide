function isCIPhone(telephone) {
  return /^(07|05|01)\d{8}$/.test(telephone);
}

function getOperateurFromPhone(telephone) {
  if (!isCIPhone(telephone)) return null;
  const prefix = telephone.substring(0, 2);
  const map = { '07': 'Orange', '05': 'MTN', '01': 'Moov' };
  return map[prefix] || null;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeString(str) {
  return str.replace(/[<>"'&]/g, '');
}

module.exports = { isCIPhone, getOperateurFromPhone, validateEmail, sanitizeString };
