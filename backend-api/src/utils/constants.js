const STATUTS_COMMANDE = {
  EN_ATTENTE_PAIEMENT: 'en_attente_paiement',
  PAIEMENT_SOUMIS: 'paiement_soumis',
  PAIEMENT_VALIDE: 'paiement_valide',
  PAIEMENT_REJETE: 'paiement_rejete',
  EN_COURS_EXECUTION: 'en_cours_execution',
  EXECUTE: 'execute',
  ECHOUE: 'echoue',
  REMBOURSE: 'rembourse',
};

const STATUTS_EXECUTION = {
  EN_ATTENTE: 'en_attente',
  EN_COURS: 'en_cours',
  REUSSI: 'reussi',
  ECHOUE: 'echoue',
  TIMEOUT: 'timeout',
  ANNULE: 'annule',
};

const STATUTS_VALIDATION = {
  EN_ATTENTE: 'en_attente',
  VALIDE_AUTO: 'valide_auto',
  VALIDE_MANUEL: 'valide_manuel',
  REJETE: 'rejete',
  A_REVISER: 'a_reviser',
};

const OPERATEURS_CI = ['Orange', 'MTN', 'Moov'];
const PREFIXES_CI = ['07', '05', '01'];

module.exports = {
  STATUTS_COMMANDE,
  STATUTS_EXECUTION,
  STATUTS_VALIDATION,
  OPERATEURS_CI,
  PREFIXES_CI,
};
