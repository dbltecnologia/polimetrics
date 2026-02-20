import api from '@/services/api';
import { City } from '@/types/city';

export async function getCities(): Promise<City[]> {
  const response = await api.get('/cities');
  return response.data;
}
