import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = 'https://broketogetherbackend-production.up.railway.app/api/v1';

// --- Rate Limiter ---
// Global: 60 requests per minute (covers normal navigation easily)
const globalLimit = { requests: [], max: 60, windowMs: 60000 };

// Mutation cooldown: 1 POST/PUT/DELETE per endpoint every 2 seconds
// Prevents spam-tapping "Add Expense", "Settle", "Create Home", etc.
const mutationCooldowns = {};
const MUTATION_COOLDOWN_MS = 2000;

const checkGlobalLimit = () => {
  const now = Date.now();
  globalLimit.requests = globalLimit.requests.filter(
    (t) => now - t < globalLimit.windowMs
  );
  if (globalLimit.requests.length >= globalLimit.max) return false;
  globalLimit.requests.push(now);
  return true;
};

const checkMutationCooldown = (method, url) => {
  if (method === 'get') return true; // reads are always allowed
  const key = `${method}:${url}`;
  const now = Date.now();
  const last = mutationCooldowns[key] || 0;
  if (now - last < MUTATION_COOLDOWN_MS) return false;
  mutationCooldowns[key] = now;
  return true;
};

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor — attach auth token + enforce rate limits
client.interceptors.request.use(
  async (config) => {
    if (!checkGlobalLimit()) {
      const err = new Error('Too many requests. Please wait a moment and try again.');
      err.isRateLimited = true;
      return Promise.reject(err);
    }

    if (!checkMutationCooldown(config.method, config.url)) {
      const err = new Error('Please wait before trying that again.');
      err.isRateLimited = true;
      return Promise.reject(err);
    }

    const token = await SecureStore.getItemAsync('userToken');

    if (token) {
      const cleanToken = token.replace(/"/g, '').trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default client;