// Medicine lookup API calls
import { API_BASE_URL, getHeaders, toApiError, handleResponse } from './apiClient';

export interface Medicine {
  sku_id: number;
  name: string;
  manufacturer_name: string;
  marketer_name: string;
  type: string;
  price: number;
  pack_size_label: string;
  short_composition: string;
}

export interface MedicineApiResponse {
  success: boolean;
  message: string;
  data: Medicine[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export const getMedicineByName = async (name: string): Promise<MedicineApiResponse> => {
  try {
    if (!name.trim()) {
      throw new Error('Search term is required');
    }

    const res = await fetch(`${API_BASE_URL}/medicine/medicine-name?name=${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });

    const response = await handleResponse(res);

    if (!response.ok) {
      throw new Error('Failed to fetch medicine data');
    }

    return response.json();
  } catch (error) {
    throw toApiError(error, 'Failed to fetch medicine data');
  }
};
