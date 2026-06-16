const { hasCredentials, isConfigured } = require('../services/jeko.service');
const axios = require('axios');

async function jekoHealth(req, res) {
  const result = {
    credentials: {
      api_key: Boolean(process.env.JEKO_API_KEY),
      api_key_id: Boolean(process.env.JEKO_API_KEY_ID),
      store_id: Boolean(process.env.JEKO_STORE_ID),
      webhook_secret: Boolean(process.env.JEKO_WEBHOOK_SECRET),
      complete: isConfigured(),
    },
    api: null,
    store_name_cockpit: 'Unités Rapide',
    next_steps: [],
  };

  if (!hasCredentials()) {
    result.api = { status: 'missing_credentials' };
    result.next_steps.push('Configurer JEKO_API_KEY et JEKO_API_KEY_ID dans .env');
    return res.json(result);
  }

  try {
    const { data, status } = await axios.get(`${process.env.JEKO_API_BASE || 'https://api.jeko.africa'}/partner_api/stores`, {
      headers: {
        'X-API-KEY': process.env.JEKO_API_KEY,
        'X-API-KEY-ID': process.env.JEKO_API_KEY_ID,
      },
      timeout: 15000,
      validateStatus: () => true,
    });

    if (status === 200) {
      const stores = Array.isArray(data) ? data : data.stores || data.data || [];
      result.api = { status: 'ok', http: 200, stores_count: stores.length, stores };
      if (!process.env.JEKO_STORE_ID && stores.length > 0) {
        const first = stores[0];
        result.next_steps.push(`Copier JEKO_STORE_ID=${first.id || first.storeId} dans .env`);
      }
      if (!process.env.JEKO_WEBHOOK_SECRET) {
        result.next_steps.push('Configurer JEKO_WEBHOOK_SECRET depuis Cockpit → Paramètres → API & Webhooks');
      }
    } else if (status === 403 && data?.id === 'business_not_enabled_for_api_access') {
      result.api = {
        status: 'business_not_enabled_for_api_access',
        http: 403,
        message: data.message,
      };
      result.next_steps.push('Demander l\'activation API à Jeko (development@jeko.africa)');
      result.next_steps.push('Vérifier que le compte « Unités Rapide » est validé dans le Cockpit');
      result.next_steps.push('Cockpit → Paramètres → API & Webhooks : générer clés et activer l\'accès');
    } else if (status === 401) {
      result.api = { status: 'unauthorized', http: 401, message: data?.message };
      result.next_steps.push('Vérifier JEKO_API_KEY et JEKO_API_KEY_ID dans Cockpit');
    } else {
      result.api = { status: 'error', http: status, body: data };
    }
  } catch (err) {
    result.api = { status: 'network_error', message: err.message };
  }

  if (result.credentials.complete && result.api?.status === 'ok') {
    result.next_steps.push('Configurer le webhook : https://votre-domaine.com/api/webhook/jeko');
  }

  res.json(result);
}

module.exports = { jekoHealth };
