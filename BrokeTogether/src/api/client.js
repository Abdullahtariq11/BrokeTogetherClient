import axios from 'axios';

// Replace with your actual Railway URL
const API_URL = 'https://broketogetherbackend-production.up.railway.app/api/v1';

const client = axios.create({
  baseURL: API_URL,
  timeout: 5000, // 5 seconds
});

export default client;