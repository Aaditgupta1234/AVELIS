import { apiClient } from './client.js';

export const getBundlesApi = async () => {
  try {
    const res = await apiClient.get('/bundles');
    return res.data;
  } catch (err) {
    console.error('Failed to fetch bundles from backend API:', err);
    throw err;
  }
};

export const createBundleApi = async (bundleData) => {
  try {
    const res = await apiClient.post('/bundles', bundleData);
    return res.data;
  } catch (err) {
    console.error('Failed to create bundle via backend API:', err);
    throw err;
  }
};

export const updateBundleApi = async (id, bundleData) => {
  try {
    const res = await apiClient.put(`/bundles/${id}`, bundleData);
    return res.data;
  } catch (err) {
    console.error(`Failed to update bundle ${id} via backend API:`, err);
    throw err;
  }
};

export const deleteBundleApi = async (id) => {
  try {
    const res = await apiClient.delete(`/bundles/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Failed to delete bundle ${id} via backend API:`, err);
    throw err;
  }
};
