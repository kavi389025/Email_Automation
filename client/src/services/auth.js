import api from './api';

export const authService = {
  async register({ name, email, password }) {
    return api.post('/auth/register', { name, email, password });
  },

  async login({ email, password }) {
    return api.post('/auth/login', { email, password });
  },

  async getProfile() {
    return api.get('/auth/me');
  },
};
