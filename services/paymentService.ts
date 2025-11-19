import { api } from '@/shared';
import {
  ApiResponse,
  PaymentDetail,
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentsResponse,
  PaymentStatus,
} from '@/types';

interface PaymentFilters {
  status?: PaymentStatus;
  from_date?: string;
  to_date?: string;
  patient_name?: string;
  page?: number;
  limit?: number;
}

export const paymentService = {
  createPayment: (data: PaymentCreateRequest) => {
    return api.post<ApiResponse<PaymentCreateResponse>>('/v1/payments', data);
  },

  getPayments: (filters?: PaymentFilters) => {
    return api.get<ApiResponse<PaymentsResponse>>('/v1/payments', {
      params: filters,
    });
  },

  getPaymentDetail: (paymentId: string) => {
    return api.get<ApiResponse<{ payment: PaymentDetail }>>(`/v1/payments/${paymentId}`);
  },

  updatePaymentStatus: (paymentId: string, status: PaymentStatus, note?: string) => {
    return api.put<ApiResponse<{ payment_id: string; status: PaymentStatus; updated_at: string }>>(
      `/v1/payments/${paymentId}/status`,
      { status, note }
    );
  },

  cancelPayment: (paymentId: string, reason?: string) => {
    return api.post<ApiResponse<{ payment_id: string; status: PaymentStatus; updated_at: string }>>(
      `/v1/payments/${paymentId}/cancel`,
      { reason }
    );
  },
};