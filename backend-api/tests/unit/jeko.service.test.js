const {
  inferPaymentMethod,
  normalizePaymentMethod,
  isConfigured,
  hasCredentials,
  VALID_METHODS,
} = require('../../src/services/jeko.service');

describe('jeko.service helpers', () => {
  test('inferPaymentMethod from Ivorian prefix', () => {
    expect(inferPaymentMethod('0701020304')).toBe('orange');
    expect(inferPaymentMethod('0501020304')).toBe('mtn');
    expect(inferPaymentMethod('0101020304')).toBe('moov');
  });

  test('normalizePaymentMethod validates allowed methods', () => {
    expect(normalizePaymentMethod('wave')).toBe('wave');
    expect(normalizePaymentMethod('invalid')).toBe('wave');
  });

  test('VALID_METHODS contains all providers', () => {
    expect(VALID_METHODS.has('wave')).toBe(true);
    expect(VALID_METHODS.has('orange')).toBe(true);
    expect(VALID_METHODS.has('djamo')).toBe(true);
  });

  test('hasCredentials returns false without env vars', () => {
    expect(hasCredentials()).toBe(false);
  });
});
