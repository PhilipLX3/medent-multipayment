import api from '@/shared/services/api';
import {
  ApiResponse,
  Contract,
  ContractFilters,
  CreateContractRequest,
  UpdateContractRequest,
  ContractsResponse,
} from '@/shared/types';

// Backend CreateContractDto interface - matches exactly with backend
interface CreateContractDto {
  customerId: string;
  customerName: string;
  treatmentName: string;
  contractAmount: number;
  financeCompanyId: number;
  paymentMethodId: number;
  contractTypeId: number;
  statusId: number;
  interestRate: number;
  leaseTerm: number;
  numberOfPayments: number;
  monthlyLeasePayment?: number;
  notes?: string;
  hasInsurance?: boolean;
  hasTransferConditions?: boolean;
  includesManagementConsulting?: boolean;
  specialConditions?: string;
}

export const contractService = {
  /**
   * Get all contracts with optional filters
   * GET /api/v1/contracts
   */
  getContracts: (filters?: ContractFilters) => {
    return api.get<ApiResponse<ContractsResponse>>('/v1/contracts', {
      params: filters,
    });
  },

  /**
   * Get a specific contract by ID
   * GET /api/v1/contracts/{id}
   */
  getById: (id: string) => {
    return api.get<ApiResponse<Contract>>(`/v1/contracts/${id}`);
  },

  /**
   * Create a new contract (frontend format)
   * POST /api/v1/contracts
   */
  create: (data: CreateContractRequest) => {
    return api.post<ApiResponse<Contract>>('/v1/contracts', data);
  },

  /**
   * Create a new contract using backend DTO format
   * POST /api/v1/contracts
   */
  createWithBackendDto: (data: CreateContractDto) => {
    return api.post<ApiResponse<Contract>>('/v1/contracts', data);
  },

  /**
   * Update an existing contract
   * PUT /api/v1/contracts/{id}
   */
  update: (id: string, data: UpdateContractRequest) => {
    return api.put<ApiResponse<Contract>>(`/v1/contracts/${id}`, data);
  },

  /**
   * Delete a contract
   * DELETE /api/v1/contracts/{id}
   */
  delete: (id: string) => {
    return api.delete<ApiResponse<null>>(`/v1/contracts/${id}`);
  },

  /**
   * Update contract status
   * PATCH /api/v1/contracts/{id}/status
   */
  updateStatus: (id: string, status: string) => {
    return api.patch<ApiResponse<Contract>>(`/v1/contracts/${id}/status`, { status });
  },

  /**
   * Update service progress for special contracts
   * PUT /api/v1/contracts/{id}/service-progress
   */
  updateServiceProgress: (id: string, progress: number) => {
    return api.put<ApiResponse<Contract>>(`/v1/contracts/${id}/service-progress`, {
      service_completion_rate: progress,
    });
  },

  /**
   * Approve contract
   * POST /api/v1/contracts/{id}/approve
   */
  approve: (id: string) => {
    return api.post<ApiResponse<Contract>>(`/v1/contracts/${id}/approve`);
  },

  /**
   * Complete contract
   * POST /api/v1/contracts/{id}/complete
   */
  complete: (id: string) => {
    return api.post<ApiResponse<Contract>>(`/v1/contracts/${id}/complete`);
  },

  /**
   * Export contracts to CSV
   * GET /api/v1/contracts/export
   */
  export: (filters?: ContractFilters) => {
    return api.get('/v1/contracts/export', {
      params: filters,
      responseType: 'blob', // Important for file downloads
    });
  },
};
