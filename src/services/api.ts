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

const normalizeApiBaseUrl = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, '');

  if (!trimmed) {
    return 'http://localhost:8080';
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
};

const rawApiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.process?.env?.REACT_APP_API_URL) ||
  'http://localhost:8080';

export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl);
const getHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
  };
};
// const getAuthHeaders = (): HeadersInit => {
//   if (typeof window === 'undefined') return {};

//   const userStr = localStorage.getItem('user');
//   if (!userStr) return {};

//   try {
//     const user = JSON.parse(userStr);
//     const token = user?.token || user?.accessToken || user?.jwt;
//     if (!token) return {};
//     return {
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     };
//   } catch (e) {
//     console.error('Failed to parse auth token', e);
//     return {};
//   }
// };
const handleResponse = async (response: Response) => {
  if (response.status === 401) {
   
    throw new Error('Incorrect credentials. Please log in again.');
  }
  return response;
};
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

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  license_number: string | null;
  status: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  role: string;
  fullname: string;
  username: string;
  email: string;
  password: string;
}

export interface InventoryItem {
  name: string;
  manufacturername: string;
  type: string;
  packsizelabel: string;
  composition1: string;
  composition2: string;
  mrp: number;
  batchnumber: string;
  shelfrackinfo: string;
  stockquantity: number;
  purchaseprice: number;
  sellingprice: number;
  stockalertthreshold: number;
  expirydate: string;
  username: string;
  insertdate: string;
  updatedate: string;
}
export interface UserProfile {
  id: string; // UUID from database
  username: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  license_number: string | null;
  status: string;
}

export interface UserProfileResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}

export interface InventoryRecord {
  id: number;
  name: string;
  manufacturer_name: string;
  type: string;
  pack_size_label: string;
  composition1: string;
  composition2: string;
  mrp: number | null;
  batch_number: string | null;
  shelf_rack_info: string | null;
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
  search?: string;
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
  data?: InventoryRecord[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
export interface RegisterPayload {
  role: string;
  fullname: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  username: string;
  token: string;
  error?: string;
}


export const sendRegistrationOtp = async (email: string) => {
  const response = await fetch(`${API_BASE_URL}/user/send-otp`, {
    method: "POST",
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to send OTP");
  return data;
};
export const verifyRegistrationOtp = async (email: string, otp: string, token: string | null) => {
  const response = await fetch(`${API_BASE_URL}/user/verify-otp`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      email,
      otp,
      token
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
  return data;
};
export const logoutUser = async (): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/user/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Sends cookie to server so server can clear it
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'Logout failed');
  }
  return body;
};

// 4. Step 3 of Registration: Create the actual account
export const finalizeRegistration = async (userData: any) => {
  const response = await fetch(`${API_BASE_URL}/user/register`, {
    method: "POST",
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Registration failed");
  return data;
};

// 🌟 3. Login User API Call
export const  loginUser = async (data: LoginPayload): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/user/login`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || 'Login failed');
  }
  return body;
};
export const getCurrentUserProfile = async (): Promise<UserProfileResponse> => {
  const res = await fetch(`${API_BASE_URL}/user/profile`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });

  const response = await handleResponse(res);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || 'Failed to fetch user profile');
  }

  return body;
};

export const getMedicineByName = async (name: string): Promise<MedicineApiResponse> => {
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
};

export const getManufacturerName = async (name: string): Promise<{ success: boolean; message: string; data: Manufacturer[] }> => {
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
};

export const getInventoryList = async (params: InventoryListParams = {}): Promise<InventoryListResponse> => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const res = await fetch(`${API_BASE_URL}/inventory/get-inventory?${query.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });

  const response = await handleResponse(res);

  const body: InventoryListResponse = await response
    .json()
    .catch(() => ({} as InventoryListResponse));

  if (!response.ok && response.status !== 404) {
    throw new Error(
      body?.error || body?.message || `Failed to fetch inventory data (HTTP ${response.status})`
    );
  }

  return body;
};

export const addInventory = async (item: InventoryItem): Promise<{ success: boolean; message: string }> => {

  const res = await fetch(`${API_BASE_URL}/inventory/add-inventory`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(item), // Changed from payload to item
  });
  const response = await handleResponse(res);
  if (!response.ok) {
    try {
      const errorData = await response.json();
      console.error("Backend Validation Error Details:", errorData);
    } catch (e) {
      console.error("Could not parse backend error body.", e);
    }
    throw new Error(`Failed to save inventory item: ${response.statusText}`);
  }

  return response.json();
};

export const deleteInventoryItem = async ({ id, ...params }: { id: number | string; user: string; reason: string }): Promise<void> => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/inventory/delete-inventory/${id}?${query}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  });

  const response = await handleResponse(res);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || body?.message || 'Failed to delete inventory item');
  }
};