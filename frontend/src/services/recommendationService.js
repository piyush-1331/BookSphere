import axios from 'axios';

/**
 * Express Backend API Base URL.
 * React communicates exclusively with Express (port 5000), NEVER with the internal FastAPI microservice.
 * Service credentials (AI_SERVICE_TOKEN) and FastAPI location (FASTAPI_BASE_URL) remain private to the backend.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Automatically attach HttpOnly auth cookie
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s client timeout
});

/**
 * Fetch personalized AI recommendations for the authenticated patron.
 *
 * Flow:
 * React (this function)
 *   ↓ Axios POST /api/recommendations
 * Express API Backend
 *   ↓ Axios POST FASTAPI_BASE_URL/api/recommendations (with AI_SERVICE_TOKEN)
 * FastAPI AI Recommendation Microservice
 *   ↓ Content-Based Algorithmic Filtering
 * Express API (Validates response with Zod)
 *   ↓ Returns validated recommendation data
 * React
 *
 * @param {object} [options={}] - Recommendation request configuration
 * @param {number} [options.limit=5] - Number of recommendations to generate (1-20)
 * @param {boolean} [options.preferAvailable=true] - Prefer books currently in stock
 * @param {boolean} [options.allowFallback=false] - If true, permits Express to fallback to popular database highlights when AI service is unavailable
 * @param {object} [options.preferences] - Optional real-time user taste overrides
 * @param {string[]} [options.preferences.favorite_genres]
 * @param {string[]} [options.preferences.favorite_categories]
 * @param {string[]} [options.preferences.favorite_authors]
 * @param {string} [token] - Optional Authorization Bearer token (if not using HttpOnly cookie)
 * @returns {Promise<object>} Recommendation payload { success, total, strategy, is_personalized, data }
 */
export const fetchRecommendations = async (options = {}, token = null) => {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await apiClient.post('/api/recommendations', options, { headers });
  return response.data;
};

export default {
  fetchRecommendations,
};
