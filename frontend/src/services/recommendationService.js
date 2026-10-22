import axiosClient from '../api/axiosClient';

/**
 * Fetch personalized AI recommendations for the authenticated patron.
 * Uses centralized axiosClient configured with baseURL and withCredentials: true.
 *
 * @param {object} [options={}] - Recommendation request configuration
 * @param {string} [token] - Optional Authorization Bearer token (if not using HttpOnly cookie)
 * @returns {Promise<object>} Recommendation payload { success, total, strategy, is_personalized, data }
 */
export const fetchRecommendations = async (options = {}, token = null) => {
  const headers = {};
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  const response = await axiosClient.post('/api/recommendations', options, { headers });
  return response.data;
};

export default {
  fetchRecommendations,
};
