// Re-export from payment.ts
export {
  PaymentStatus,
  PaymentStatusLabels,
  PaymentStatusColors,
  type Payment,
  type SortDirection,
  type SortConfig,
} from './payment';

// Re-export from application.ts
export {
  type SystemValue,
  type UserBrief,
  type ApplicationResponse,
  type AttachmentResponse,
  type CreateApplicationRequest,
  type UpdateApplicationRequest,
  type SendToClinicRequest,
  type ApplicationFilters,
  type ApplicationsListResponse,
} from './application';

// Re-export from project.ts
export {
  type Project,
  type ProjectFilters,
  type CreateProjectRequest,
  type UpdateProjectRequest,
  type ProjectsResponse,
} from './project';

// Re-export from contract.ts
export {
  type Contract,
  type ContractFilters,
  type CreateContractRequest,
  type UpdateContractRequest,
  type ContractsResponse,
} from './contract';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  refreshAuthToken: () => Promise<boolean>;
  validateToken: () => Promise<boolean>;
}

// PaymentStatus is now exported from ./payment.ts

export enum PaymentMethod {
  NORMAL_LOAN = '通常ローン',
  SPECIAL_LOAN = '特別ローン',
  CARD = 'カード決済',
  UNSELECTED = '未選択'
}

// Payment interface is now exported from ./payment.ts

export interface PaymentDetail {
  payment_id: string;
  patient_id?: string;
  patient_name: string;
  treatment_name: string;
  amount: number;
  payment_method: PaymentMethod;
  status: string;
  requested_at?: string;
  applied_at?: string;
  completed_at?: string;
  memo?: string;
  loan_details?: {
    installments: number;
    monthly_payment: number;
    interest_rate: number;
  };
  history: {
    status: string;
    datetime: string;
    note?: string;
  }[];
}

export interface PaymentCreateRequest {
  patient_id?: string;
  patient_name?: string;
  treatment_name?: string;
  amount?: number;
  memo?: string;
}

export interface PaymentCreateResponse {
  payment_id: string;
  payment_link: string;
  qr_code: string;
  expires_at: string;
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
}

export interface PaymentsResponse {
  payments: any[]; // Payment型は ./payment.ts からインポートして使用
  pagination: PaginationInfo;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}