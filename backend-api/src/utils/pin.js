const PIN_PATTERN = /^\d{4}$/;

function isValidPin(codePin) {
  return PIN_PATTERN.test(String(codePin));
}

function normalizePin(codePin) {
  return String(codePin).trim();
}

module.exports = { isValidPin, normalizePin, PIN_PATTERN };
