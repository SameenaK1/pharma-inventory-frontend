// Manufacturer lookup API calls
import { API_BASE_URL, getHeaders, toApiError, handleResponse } from './apiClient';

export interface Manufacturer {
  id: number;
  name: string;
}

export const getManufacturerName = async (name: string): Promise<{ success: boolean; message: string; data: Manufacturer[] }> => {
  try {
    if (!name.trim()) {
      throw new Error('Search term is required');
    }

    const res = await fetch(`${API_BASE_URL}/manufacturer/search?name=${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });

    const response = await handleResponse(res);

    if (!response.ok) {
      throw new Error('Failed to fetch manufacturer data');
    }

    return response.json();
  } catch (error) {
    throw toApiError(error, 'Failed to fetch manufacturer data');
  }
};
