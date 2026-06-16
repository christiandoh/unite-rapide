const { VALIDATED_STATUSES } = require('../../src/services/paymentValidation.service');

describe('paymentValidation service', () => {
  test('VALIDATED_STATUSES includes post-payment states', () => {
    expect(VALIDATED_STATUSES.has('paiement_valide')).toBe(true);
    expect(VALIDATED_STATUSES.has('en_cours_execution')).toBe(true);
    expect(VALIDATED_STATUSES.has('execute')).toBe(true);
    expect(VALIDATED_STATUSES.has('en_attente_paiement')).toBe(false);
  });
});
