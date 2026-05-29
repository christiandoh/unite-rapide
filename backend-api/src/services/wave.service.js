const QRCode = require('qrcode');

const MERCHANT_CODE = process.env.WAVE_MERCHANT_CODE || 'MON_CODE_MARCHAND';
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://ussd-automation.com/api/webhook/wave';

function generatePaymentLink(amount, reference) {
  const url = `https://pay.wave.com/m/${MERCHANT_CODE}/c/ci/?amount=${amount}`;

  return {
    url,
    reference,
  };
}

async function generatePaymentLinkWithQR(amount, reference) {
  const { url } = generatePaymentLink(amount, reference);

  const qrCode = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: { dark: '#0055FF', light: '#FFFFFF' },
  });

  return { url, qrCode, reference };
}

function validateWaveReference(reference) {
  return /^USSD-\d{8}-[A-Z0-9]{6}$/.test(reference);
}

module.exports = { generatePaymentLink, generatePaymentLinkWithQR, validateWaveReference };
