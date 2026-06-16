const Joi = require('joi');

const loginSchema = Joi.object({
  telephone: Joi.string().pattern(/^(07|05|01)\d{8}$/).required(),
  code_pin: Joi.string().pattern(/^\d{4}$/).required(),
});

const registerSchema = Joi.object({
  nom: Joi.string().trim().min(2).max(100).required(),
  prenom: Joi.string().trim().min(2).max(100).allow(''),
  telephone: Joi.string().pattern(/^(07|05|01)\d{8}$/).required(),
  email: Joi.string().email().allow(''),
  code_pin: Joi.string().pattern(/^\d{4}$/).required(),
});

describe('auth validation schemas', () => {
  test('login accepts valid phone and PIN', () => {
    const { error } = loginSchema.validate({ telephone: '0701020304', code_pin: '4829' });
    expect(error).toBeUndefined();
  });

  test('login rejects short PIN', () => {
    const { error } = loginSchema.validate({ telephone: '0701020304', code_pin: '123' });
    expect(error).toBeDefined();
  });

  test('login rejects invalid phone', () => {
    const { error } = loginSchema.validate({ telephone: '0601020304', code_pin: '1234' });
    expect(error).toBeDefined();
  });

  test('register requires 4-digit code_pin', () => {
    const { error } = registerSchema.validate({
      nom: 'Kouassi',
      prenom: 'Jean',
      telephone: '0701020304',
      code_pin: 'abcd',
    });
    expect(error).toBeDefined();
  });
});
