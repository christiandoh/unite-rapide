const axios = require('axios');
const QRCode = require('qrcode');
const { logger } = require('../config/logger');

const JEKO_API_BASE = process.env.JEKO_API_BASE || 'https://api.jeko.africa';
const JEKO_API_KEY = process.env.JEKO_API_KEY;
const JEKO_API_KEY_ID = process.env.JEKO_API_KEY_ID;
const JEKO_STORE_ID = process.env.JEKO_STORE_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:8082';
const DEFAULT_METHOD = process.env.JEKO_DEFAULT_PAYMENT_METHOD || 'wave';

const VALID_METHODS = new Set(['orange', 'wave', 'mtn', 'moov', 'djamo']);

function isConfigured() {
  return Boolean(JEKO_API_KEY && JEKO_API_KEY_ID && JEKO_STORE_ID);
}

function hasCredentials() {
  return Boolean(JEKO_API_KEY && JEKO_API_KEY_ID);
}

function inferPaymentMethod(telephone) {
  if (!telephone) return DEFAULT_METHOD;
  const local = telephone.replace(/^\+225/, '').replace(/\D/g, '');
  const map = { '07': 'orange', '05': 'mtn', '01': 'moov' };
  return map[local.substring(0, 2)] || DEFAULT_METHOD;
}

function normalizePaymentMethod(method) {
  const m = (method || DEFAULT_METHOD).toLowerCase();
  return VALID_METHODS.has(m) ? m : DEFAULT_METHOD;
}

function formatPhoneE164(telephone) {
  const digits = telephone.replace(/\D/g, '');
  if (telephone.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('225')) return `+${digits}`;
  return `+225${digits}`;
}

function buildClient() {
  if (!hasCredentials()) {
    throw new Error('Configuration Jeko incomplète (JEKO_API_KEY et JEKO_API_KEY_ID requis)');
  }
  return axios.create({
    baseURL: JEKO_API_BASE,
    timeout: 30000,
    headers: {
      'X-API-KEY': JEKO_API_KEY,
      'X-API-KEY-ID': JEKO_API_KEY_ID,
      'Content-Type': 'application/json',
    },
  });
}

async function listStores() {
  const client = buildClient();
  const { data } = await client.get('/partner_api/stores');
  return data;
}

async function getPaymentRequest(paymentRequestId) {
  const client = buildClient();
  const { data } = await client.get(`/partner_api/payment_requests/${paymentRequestId}`);
  return data;
}

/**
 * Crée une demande de paiement Jeko (type redirect).
 * @see https://developer.jeko.africa/api-reference/demandes-de-paiement/créer-une-demande-de-paiement
 */
async function createPaymentRequest({
  amount,
  reference,
  commandeId,
  payerPhone,
  paymentMethod,
}) {
  if (!JEKO_STORE_ID) {
    throw new Error('JEKO_STORE_ID manquant — listez vos magasins via GET /api/admin/jeko/stores');
  }

  const client = buildClient();
  const method = normalizePaymentMethod(paymentMethod || inferPaymentMethod(payerPhone));
  const amountCents = Math.round(Number(amount));

  if (amountCents < 100) {
    throw new Error('Montant minimum Jeko : 100 FCFA');
  }

  const payload = {
    amountCents,
    currency: 'XOF',
    reference,
    storeId: JEKO_STORE_ID,
    paymentDetails: {
      type: 'redirect',
      data: {
        paymentMethod: method,
        successUrl: `${FRONTEND_URL}/suivi/${commandeId}?payment=success`,
        errorUrl: `${FRONTEND_URL}/paiement/${commandeId}?payment=error`,
        forceProviderDirect: Boolean(payerPhone),
        ...(payerPhone ? { payerPhone: formatPhoneE164(payerPhone) } : {}),
      },
    },
  };

  logger.info('Création demande de paiement Jeko', { reference, amountCents, method });

  const { data } = await client.post('/partner_api/payment_requests', payload);
  return { ...data, paymentMethod: method };
}

async function createPaymentRequestWithQR(options) {
  const data = await createPaymentRequest(options);
  const url = data.redirectUrl;

  let qrCode = null;
  if (url) {
    qrCode = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: { dark: '#0055FF', light: '#FFFFFF' },
    });
  }

  return {
    url,
    qrCode,
    reference: options.reference,
    paymentRequestId: data.id,
    paymentMethod: data.paymentMethod,
    status: data.status,
  };
}

module.exports = {
  createPaymentRequest,
  createPaymentRequestWithQR,
  listStores,
  getPaymentRequest,
  inferPaymentMethod,
  normalizePaymentMethod,
  isConfigured,
  hasCredentials,
  VALID_METHODS,
};
