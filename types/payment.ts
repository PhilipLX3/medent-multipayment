export enum PaymentStatus {
  // 初期状態
  PAYMENT_REQUESTED = 'payment_requested', // 決済依頼済み
  REQUESTED = 'REQUESTED', // 依頼済み
  
  // 審査
  REVIEWING = 'reviewing', // 審査中
  REVIEW_APPROVED = 'review_approved', // 審査OK
  REVIEW_REJECTED = 'review_rejected', // 審査NG
  APPROVED = 'APPROVED', // 承認済み
  REJECTED = 'REJECTED', // 却下
  
  // 二次審査
  SECONDARY_REVIEWING = 'secondary_reviewing', // 二次審査中
  SECONDARY_APPROVED = 'secondary_approved', // 二次審査OK
  SECONDARY_REJECTED = 'secondary_rejected', // 二次審査NG
  
  // 特別審査
  SPECIAL_REVIEWING = 'special_reviewing', // 特別審査中
  SPECIAL_APPROVED = 'special_approved', // 特別審査OK
  SPECIAL_REJECTED = 'special_rejected', // 特別審査NG
  
  // 売上・完了
  SALES_REQUESTED = 'SALES_REQUESTED', // 売上計上依頼
  COMPLETED = 'COMPLETED', // 完了
  CANCELED = 'CANCELED', // キャンセル
  PAYMENT_COMPLETED = 'payment_completed', // 決済完了
}

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PAYMENT_REQUESTED]: '決済依頼済み',
  [PaymentStatus.REQUESTED]: '依頼済み',
  [PaymentStatus.REVIEWING]: '審査中',
  [PaymentStatus.REVIEW_APPROVED]: '審査OK',
  [PaymentStatus.REVIEW_REJECTED]: '審査NG',
  [PaymentStatus.APPROVED]: '承認済み',
  [PaymentStatus.REJECTED]: '却下',
  [PaymentStatus.SECONDARY_REVIEWING]: '二次審査中',
  [PaymentStatus.SECONDARY_APPROVED]: '二次審査OK',
  [PaymentStatus.SECONDARY_REJECTED]: '二次審査NG',
  [PaymentStatus.SPECIAL_REVIEWING]: '特別審査中',
  [PaymentStatus.SPECIAL_APPROVED]: '特別審査OK',
  [PaymentStatus.SPECIAL_REJECTED]: '特別審査NG',
  [PaymentStatus.SALES_REQUESTED]: '売上計上依頼',
  [PaymentStatus.COMPLETED]: '完了',
  [PaymentStatus.CANCELED]: 'キャンセル',
  [PaymentStatus.PAYMENT_COMPLETED]: '決済完了',
};

export const PaymentStatusColors: Record<PaymentStatus, {
  background: string;
  text: string;
  border?: string;
}> = {
  [PaymentStatus.PAYMENT_REQUESTED]: {
    background: '#e3f2fd',
    text: '#1565c0',
  },
  [PaymentStatus.REVIEWING]: {
    background: '#fff3e0',
    text: '#e65100',
  },
  [PaymentStatus.REVIEW_APPROVED]: {
    background: '#e8f5e9',
    text: '#2e7d32',
  },
  [PaymentStatus.REVIEW_REJECTED]: {
    background: '#ffebee',
    text: '#c62828',
  },
  [PaymentStatus.SECONDARY_REVIEWING]: {
    background: '#fce4ec',
    text: '#c2185b',
  },
  [PaymentStatus.SECONDARY_APPROVED]: {
    background: '#e8f5e9',
    text: '#2e7d32',
  },
  [PaymentStatus.SECONDARY_REJECTED]: {
    background: '#ffebee',
    text: '#c62828',
  },
  [PaymentStatus.SPECIAL_REVIEWING]: {
    background: '#f3e5f5',
    text: '#6a1b9a',
  },
  [PaymentStatus.SPECIAL_APPROVED]: {
    background: '#e8f5e9',
    text: '#2e7d32',
  },
  [PaymentStatus.SPECIAL_REJECTED]: {
    background: '#ffebee',
    text: '#c62828',
  },
  [PaymentStatus.PAYMENT_COMPLETED]: {
    background: '#1976d2',
    text: '#ffffff',
  },
  [PaymentStatus.REQUESTED]: {
    background: '#e3f2fd',
    text: '#1565c0',
  },
  [PaymentStatus.APPROVED]: {
    background: '#e8f5e9',
    text: '#2e7d32',
  },
  [PaymentStatus.REJECTED]: {
    background: '#ffebee',
    text: '#c62828',
  },
  [PaymentStatus.SALES_REQUESTED]: {
    background: '#fff8e1',
    text: '#f57c00',
  },
  [PaymentStatus.COMPLETED]: {
    background: '#e0f2f1',
    text: '#00695c',
  },
  [PaymentStatus.CANCELED]: {
    background: '#fafafa',
    text: '#616161',
  },
};

export interface Payment {
  id: string;
  payment_id: string;
  patient_name: string;
  patient_id?: string;
  treatment_name?: string;
  amount: number;
  status: PaymentStatus;
  payment_method?: string;
  payment_link?: string;
  clinic_id: string;
  clinic_name?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  application_id?: string;
  finance_company?: string;
  monthly_payment?: number;
  installments?: number;
  expected_deposit_date?: string;
  requested_at?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: keyof Payment;
  direction: SortDirection;
}