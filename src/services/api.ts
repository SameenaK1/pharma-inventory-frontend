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

export const API_BASE_URL = (typeof window !== 'undefined' && window.process?.env?.REACT_APP_API_URL) || 'http://localhost:8080';

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
export interface Manufacturer {
  id: number;
  name: string;
}

export interface InventoryItem {
  name: string;
  manufacturername: string;
  type: string;
  packsizelabel: string;
  composition1: string;
  composition2: string;
  mrp: number;
  stockquantity: number;
  purchaseprice: number;
  sellingprice: number;
  stockalertthreshold: number;
  expirydate: string;
  username: string;
  insertdate: string;
  updatedate: string;
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

export const getManufacturerName = async (name: string): Promise<{ success: boolean; message: string; data: Manufacturer[] }> => {
  if (!name.trim()) {
    throw new Error('Search term is required');
  }

  const response = await fetch(`${API_BASE_URL}/manufacturer/search?name=${encodeURIComponent(name)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch manufacturer data');
  }

  return response.json();
};

// Shape of a single row returned by GET /inventory/get-inventory (maps 1:1 to pharma.inventory columns)
export interface InventoryRecord {
  id: number;
  name: string;
  manufacturer_name: string;
  type: string;
  pack_size_label: string;
  composition1: string;
  composition2: string;
  mrp: number | null;
  stock_quantity: number;
  purchase_price: number | null;
  selling_price: number | null;
  stock_alert_threshold: number;
  expiry_date: string | null;
  user_name: string | null;
  insert_date: string;
  update_date: string;
}

export interface InventoryListParams {
  name?: string;
  manufacturer_name?: string;
  type?: string;
  composition1?: string;
  composition2?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface InventoryListResponse {
  success: boolean;
  message?: string;
  error?: string;
  data: InventoryRecord[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getInventoryList = async (params: InventoryListParams = {}): Promise<InventoryListResponse> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const response = await fetch(`${API_BASE_URL}/inventory/get-inventory?${query.toString()}`);

  // The backend returns a structured JSON body for both success (200) and "no matches" (404) cases,
  // so only genuine server failures (5xx) should be treated as thrown errors.
  const body: InventoryListResponse = await response.json();

  if (!response.ok && response.status !== 404) {
    throw new Error(body?.error || body?.message || 'Failed to fetch inventory data');
  }

  return body;
};

export const addInventory = async (item: InventoryItem): Promise<{ success: boolean; message: string }> => {
  
  const response = await fetch(`${API_BASE_URL}/inventory/add-inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item), // Changed from payload to item
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      console.error("Backend Validation Error Details:", errorData);
    } catch (e) {
      console.error("Could not parse backend error body.");
    }
    throw new Error(`Failed to save inventory item: ${response.statusText}`);
  }

  return response.json();
};

export const deleteInventoryItem = async ({ id, ...params }: { id: number | string; user: string; reason: string }): Promise<void> => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/inventory/delete-inventory/${id}?${query}`, { method: 'DELETE' });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || body?.message || 'Failed to delete inventory item');
  }
};