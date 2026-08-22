import { API_BASE_URL, getHeaders, handleResponse, toApiError } from './apiClient';

export interface CreateBillingInvoicePayload {
  doctorName?: string;
  paymentType: string;
  customerName?: string;
  phoneNumber?: string;
  patientAge?: number | null;
  patientGender?: string;
  address?: string;
  gstin?: string;
  taxBreakdown: Array<{
    rate: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
  }>;
  totalQuantity: number;
  grossAmount: number;
  discountAmount: number;
  subtotal: number;
  flatDiscount: number;
  finalPayable: number;
  items: Array<{
    medicineId?: number | null;
    medicineName: string;
    batch: string;
    expiryDate: string;
    qty: number;
    pack: string;
    mrp: number;
    sellingPrice: number;
    discount: number;
    gstPercentage: number;
    gstAmount: number;
    hsnCode?: string;
    taxableAmount: number;
    total: number;
  }>;
}

export interface CreateBillingInvoiceResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    invoice: Record<string, unknown>;
    items: Record<string, unknown>[];
  };
}

export const createBillingInvoice = async (
  payload: CreateBillingInvoicePayload
): Promise<CreateBillingInvoiceResponse> => {
  try {
    const res = await fetch(`${API_BASE_URL}/billing/invoice`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const response = await handleResponse(res);
    const body: CreateBillingInvoiceResponse = await response.json().catch(() => ({
      success: false,
      error: 'The billing server returned an invalid response',
    }));

    if (!response.ok) {
      throw new Error(body.error || body.message || 'Failed to save invoice');
    }

    return body;
  } catch (error) {
    throw toApiError(error, 'Failed to save invoice');
  }
};
