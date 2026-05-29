const Joi = require('joi');

const schemas = {
  register: Joi.object({
    nom: Joi.string().trim().min(2).max(100).required(),
    prenom: Joi.string().trim().min(2).max(100).allow(''),
    telephone: Joi.string().pattern(/^(07|05|01)\d{8}$/).required()
      .messages({ 'string.pattern.base': 'Format téléphone invalide (ex: 0701020304)' }),
    email: Joi.string().email().allow(''),
    mot_de_passe: Joi.string().min(8).max(128).required(),
  }),

  login: Joi.object({
    telephone: Joi.string().pattern(/^(07|05|01)\d{8}$/),
    email: Joi.string().email(),
    mot_de_passe: Joi.string().required(),
  }).xor('telephone', 'email'),

  commande: Joi.object({
    service_id: Joi.string().uuid().required(),
    telephone_beneficiaire: Joi.string().pattern(/^(07|05|01)\d{8}$/).required(),
  }),

  uploadProof: Joi.object({
    commande_id: Joi.string().uuid().required(),
  }),

  revalidation: Joi.object({
    action: Joi.string().valid('valider', 'rejeter').required(),
    commentaire: Joi.string().max(500).allow(''),
  }),

  createService: Joi.object({
    operateur_id: Joi.string().uuid().required(),
    nom: Joi.string().trim().min(2).max(255).required(),
    type_service: Joi.string().valid('forfait_internet', 'credit_appel', 'forfait_mixte', 'abonnement').required(),
    code_ussd: Joi.string().max(20).required(),
    sequence_ussd: Joi.array().items(Joi.string()).min(0).required(),
    montant_wave: Joi.number().positive().precision(2).required(),
    volume_data: Joi.string().max(50).allow(''),
    duree_validite: Joi.string().max(50).allow(''),
    populaire: Joi.boolean().default(false),
  }),

  updateService: Joi.object({
    nom: Joi.string().trim().min(2).max(255),
    type_service: Joi.string().valid('forfait_internet', 'credit_appel', 'forfait_mixte', 'abonnement'),
    code_ussd: Joi.string().max(20),
    sequence_ussd: Joi.array().items(Joi.string()).min(0),
    montant_wave: Joi.number().positive().precision(2),
    volume_data: Joi.string().max(50).allow(''),
    duree_validite: Joi.string().max(50).allow(''),
    actif: Joi.boolean(),
    populaire: Joi.boolean(),
  }).min(1),
};

function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) return next();

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return res.status(400).json({ error: 'Erreur de validation', details });
    }

    req.body = value;
    next();
  };
}

module.exports = { validate, schemas };
