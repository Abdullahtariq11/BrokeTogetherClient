import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Replace with your actual Railway URL
const API_URL = 'https://broketogetherbackend-production.up.railway.app/api/v1';

const client = axios.create({
  baseURL: API_URL,
  timeout: 5000, // 5 seconds
});

client.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    
    if (token) {
      // 1. Strip any potential double quotes that might have come from JSON.stringify
      const cleanToken = token.replace(/"/g, '').trim();
      
      config.headers.Authorization = `Bearer ${cleanToken}`;
      
      // DEBUG LOGS - Check these in your terminal!
      console.log("------ API DEBUG ------");
      console.log("Method:", config.method.toUpperCase());
      console.log("URL:", config.baseURL + config.url);
      console.log("Auth Header:", config.headers.Authorization);
      console.log("-----------------------");
    } else {
      console.log("!!! NO TOKEN FOUND IN SECURE STORE !!!");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default client;