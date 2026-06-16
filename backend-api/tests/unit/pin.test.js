const { isValidPin, normalizePin, PIN_PATTERN } = require('../../src/utils/pin');

describe('pin utils', () => {
  test('accepts valid 4-digit PIN', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('0000')).toBe(true);
  });

  test('rejects invalid PINs', () => {
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
    expect(isValidPin('')).toBe(false);
  });

  test('normalizePin trims whitespace', () => {
    expect(normalizePin(' 1234 ')).toBe('1234');
  });

  test('PIN_PATTERN matches exactly 4 digits', () => {
    expect(PIN_PATTERN.test('4829')).toBe(true);
    expect(PIN_PATTERN.test('48291')).toBe(false);
  });
});
