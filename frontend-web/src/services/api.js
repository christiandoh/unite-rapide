import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    if (!config || config._retryCount === undefined) config._retryCount = 0;

    // Retry on server errors (5xx) or network errors (no response)
    const isServerError = error.response?.status >= 500;
    const isNetworkError = !error.response && error.code !== 'ECONNABORTED';
    if ((isServerError || isNetworkError) && config._retryCount < 3) {
      config._retryCount++;
      const delay = config._retryCount * 1000;
      await new Promise(r => setTimeout(r, delay));
      return api(config);
    }

    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && config.url !== '/auth/refresh-token') {
        try {
          const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
          localStorage.setItem('token', data.token);
          config.headers.Authorization = `Bearer ${data.token}`;
          return api(config);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/unite/connexion';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
};

export const services = {
  list: (params) => api.get('/services', { params }),
  featured: () => api.get('/services/featured'),
  getById: (id) => api.get(`/services/${id}`),
};

export const commandes = {
  create: (data) => api.post('/commandes', data),
  myCommandes: (params) => api.get('/commandes/mes-commandes', { params }),
  getById: (id) => api.get(`/commandes/${id}`),
  cancel: (id) => api.post(`/commandes/${id}/annuler`),
};

export const paiement = {
  uploadProof: (formData) => api.post('/paiement/upload-proof', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getStatus: (commandeId) => api.get(`/paiement/status/${commandeId}`),
};

export default api;
