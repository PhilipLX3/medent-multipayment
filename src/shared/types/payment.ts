export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export const PaymentStatusLabels = {
  [PaymentStatus.PENDING]: '未処理',
  [PaymentStatus.PROCESSING]: '処理中',
  [PaymentStatus.COMPLETED]: '完了',
  [PaymentStatus.FAILED]: '失敗',
  [PaymentStatus.CANCELLED]: 'キャンセル'
};

export const PaymentStatusColors = {
  [PaymentStatus.PENDING]: 'yellow',
  [PaymentStatus.PROCESSING]: 'blue',
  [PaymentStatus.COMPLETED]: 'green',
  [PaymentStatus.FAILED]: 'red',
  [PaymentStatus.CANCELLED]: 'gray'
};

export interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  created_at: string;
  updated_at: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}