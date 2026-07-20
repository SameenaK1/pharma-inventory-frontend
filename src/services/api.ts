// API service for medicine inventory
declare global {
  interface Window {
    process?: {
      env?: {
        REACT_APP_API_URL?: string;
      };
    };
  }
}

const API_BASE_URL = (typeof window !== 'undefined' && window.process?.env?.REACT_APP_API_URL) || 'http://localhost:8080';

export interface Medicine {
  id: number;
  name: string;
  manufacturer_name: string;
  type: string;
  pack_size_label: string;
  composition1: string;
  composition2: string;
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
  if (!name.trim()) {
    throw new Error('Search term is required');
  }

  const response = await fetch(`${API_BASE_URL}/medicine/medicine-name?name=${encodeURIComponent(name)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch medicine data');
  }

  return response.json();
};