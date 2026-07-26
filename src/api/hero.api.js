import { apiClient } from './client.js';

export const getHeroApi = async () => {
  try {
    const res = await apiClient.get('/hero');
    return res.data;
  } catch (err) {
    console.error('Failed to fetch hero settings from backend API:', err);
    throw err;
  }
};

export const saveHeroApi = async (heroData) => {
  try {
    const res = await apiClient.post('/hero', heroData);
    return res.data;
  } catch (err) {
    console.error('Failed to save hero settings via backend API:', err);
    throw err;
  }
};
