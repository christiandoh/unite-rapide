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
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && error.config.url !== '/auth/refresh-token') {
        try {
          const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
          localStorage.setItem('token', data.token);
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/connexion';
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
