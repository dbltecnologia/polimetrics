import axios from 'axios';

const baseURL = typeof window === 'undefined'
  ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002'}/api`
  : '/api';

const api = axios.create({
  baseURL,
});

export default api;
