import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api', // Backend API base URL
});

// Automatically attach token from localStorage to every request
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
