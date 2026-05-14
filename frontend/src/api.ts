import axios from 'axios';
import keycloak from './auth';

const api = axios.create({
  baseURL: 'http://localhost:4000', // Gateway URL
});

api.interceptors.request.use(
  (config) => {
    if (keycloak.token) {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Rafraîchir le token si nécessaire
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await keycloak.updateToken(70);
        originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
        return api(originalRequest);
      } catch (err) {
        keycloak.login();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
