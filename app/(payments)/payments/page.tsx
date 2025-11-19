'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { paymentService } from '@/services/paymentService';
import { PaymentStatus, Payment } from '@/types';
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import clsx from 'clsx';
import PaymentDetailModal from './_components/PaymentDetailModal';
import NewPaymentModal from './_components/NewPaymentModal';
import { DashboardLayout } from '@/shared/components/layouts';

// モックデータ生成
const generateMockPayments = () => {
  const paymentMethods = ['一括払い', '分割払い', '院内分割'];
  const paymentTypes = ['カード決済', 'キャリア決済', '口座振込', 'ローン'];
  const statuses = ['PAYMENT_REQUESTED', 'REVIEWING', 'REVIEW_APPROVED', 'REVIEW_REJECTED', 'PAYMENT_COMPLETED'];
  const treatments = ['インプラント治療', '矯正治療', 'セラミック治療', 'ホワイトニング', '歯周病治療'];
  const names = ['山田太郎', '佐藤花子', '鈴木一郎', '田中美咲', '伊藤健太', '渡辺さくら', '中村大輔', '小林愛', '加藤誠', '吉田結衣'];
  
  return Array.from({ length: 10 }, (_, i) => ({
    payment_id: `PAY-${String(i + 1).padStart(4, '0')}`,
    patient_id: `PT-${String(i + 1001).padStart(4, '0')}`,
    patient_name: names[i],
    treatment_name: treatments[i % treatments.length],
    amount: Math.floor(Math.random() * 900000) + 100000,
    payment_method: paymentMethods[i % paymentMethods.length],
    payment_type: paymentTypes[i % paymentTypes.length],
    status: statuses[i % statuses.length],
    requested_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    applied_at: i % 2 === 0 ? new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000).toISOString() : null,
    completed_at: i % 3 === 0 ? new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString() : null,
  }));
};

// 拡張ステータス定義
const PaymentStatuses = {
  PAYMENT_REQUESTED: '決済依頼済み',
  REVIEWING: '審査中',
  REVIEW_APPROVED: '審査OK',
  REVIEW_REJECTED: '審査NG',
  SECONDARY_REVIEWING: '二次審査中',
  SECONDARY_APPROVED: '二次審査OK',
  SECONDARY_REJECTED: '二次審査NG',
  SPECIAL_REVIEWING: '特別審査中',
  SPECIAL_APPROVED: '特別審査OK',
  SPECIAL_REJECTED: '特別審査NG',
  PAYMENT_COMPLETED: '決済完了',
} as const;

type SortField = 'payment_id' | 'patient_id' | 'patient_name' | 'amount' | 'status' | 'requested_at' | 'applied_at' | 'completed_at';
type SortDirection = 'asc' | 'desc';

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('requested_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newPaymentModalOpen, setNewPaymentModalOpen] = useState(false);

  // モックデータを使用
  const mockPayments = useMemo(() => generateMockPayments(), []);
  
  const data = useMemo(() => ({
    payments: mockPayments,
    total: mockPayments.length,
    page: 1,
    limit: 20,
    pagination: {
      page: 1,
      limit: 20,
      total_count: mockPayments.length,
      total_pages: 1
    }
  }), [mockPayments]);
  
  const isLoading = false;

  // ソート処理
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ソート済みデータ
  const sortedData = useMemo(() => {
    if (!data?.payments) return [];
    
    const sorted = [...data.payments].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'ja')
          : bValue.localeCompare(aValue, 'ja');
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    return sorted;
  }, [data?.payments, sortField, sortDirection]);

  const handleRowClick = (payment: any) => {
    // Payment型に必要なプロパティを追加
    const paymentWithDefaults: Payment = {
      ...payment,
      payment_method: payment.payment_method || 'ローン',
      requested_at: payment.requested_at || payment.created_at,
    };
    setSelectedPayment(paymentWithDefaults);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPayment(null);
  };

  const handleAccountingRequest = async (paymentId: string) => {
    // 計上依頼の処理
    console.log('計上依頼:', paymentId);
    // TODO: API呼び出しを実装
    handleModalClose();
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      PAYMENT_REQUESTED: 'bg-blue-100 text-blue-800',
      REVIEWING: 'bg-yellow-100 text-yellow-800',
      REVIEW_APPROVED: 'bg-green-100 text-green-800',
      REVIEW_REJECTED: 'bg-red-100 text-red-800',
      SECONDARY_REVIEWING: 'bg-purple-100 text-purple-800',
      SECONDARY_APPROVED: 'bg-green-100 text-green-800',
      SECONDARY_REJECTED: 'bg-red-100 text-red-800',
      SPECIAL_REVIEWING: 'bg-indigo-100 text-indigo-800',
      SPECIAL_APPROVED: 'bg-green-100 text-green-800',
      SPECIAL_REJECTED: 'bg-red-100 text-red-800',
      PAYMENT_COMPLETED: 'bg-gray-800 text-white',
    };

    return (
      <span
        className={clsx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'
        )}
      >
        {PaymentStatuses[status as keyof typeof PaymentStatuses] || status}
      </span>
    );
  };

  return (
    <DashboardLayout>
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">決済一覧</h1>
        <div className="flex gap-2">
          <a
            href="/payments/status"
            className="btn-secondary flex items-center"
          >
            ステータス管理
          </a>
          <button
            onClick={() => setNewPaymentModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            新規決済依頼
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                ステータスで絞り込み
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="input-field"
              >
                <option value="">すべて</option>
                {Object.entries(PaymentStatuses).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                患者名で検索
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="input-field pl-10"
                  placeholder="患者名を入力"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('payment_id')}
                  >
                    <div className="flex items-center">
                      決済ID
                      {sortField === 'payment_id' && (
                        sortDirection === 'asc' ? 
                        <ChevronUpIcon className="ml-1 h-3 w-3" /> : 
                        <ChevronDownIcon className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('patient_id')}
                  >
                    <div className="flex items-center">
                      患者ID
                      {sortField === 'patient_id' && (
                        sortDirection === 'asc' ? 
                        <ChevronUpIcon className="ml-1 h-3 w-3" /> : 
                        <ChevronDownIcon className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('patient_name')}
                  >
                    <div className="flex items-center">
                      患者名
                      {sortField === 'patient_name' && (
                        sortDirection === 'asc' ? 
                        <ChevronUpIcon className="ml-1 h-3 w-3" /> : 
                        <ChevronDownIcon className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    治療名
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      金額
                      {sortField === 'amount' && (
                        sortDirection === 'asc' ? 
                        <ChevronUpIcon className="ml-1 h-3 w-3" /> : 
                        <ChevronDownIcon className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    決済方法
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    決済手段
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      ステータス
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? 
                        <ChevronUpIcon className="ml-1 h-3 w-3" /> : 
                        <ChevronDownIcon className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('requested_at')}
                  >
                    <div className="flex items-center">
                      決済依頼日
                      {sortField === 'requested_at' && (
                        sortDirection === 'asc' ? 
                        <ChevronUpIcon className="ml-1 h-3 w-3" /> : 
                        <ChevronDownIcon className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('applied_at')}
                  >
                    <div className="flex items-center">
                      申込日
                      {sortField === 'applied_at' && (
                        sortDirection === 'asc' ? 
                        <ChevronUpIcon className="ml-1 h-3 w-3" /> : 
                        <ChevronDownIcon className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('completed_at')}
                  >
                    <div className="flex items-center">
                      決済日/計上日
                      {sortField === 'completed_at' && (
                        sortDirection === 'asc' ? 
                        <ChevronUpIcon className="ml-1 h-3 w-3" /> : 
                        <ChevronDownIcon className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                      読み込み中...
                    </td>
                  </tr>
                ) : (!data?.payments || data?.payments?.length === 0) ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                      決済情報がありません
                    </td>
                  </tr>
                ) : (
                  sortedData.map((payment) => (
                    <tr
                      key={payment.payment_id}
                      onClick={() => handleRowClick(payment)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.payment_id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.patient_id || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.patient_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.treatment_name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        ¥{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.payment_method || '一括払い'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.payment_type || 'ローン'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.requested_at
                          ? dayjs(payment.requested_at).format('YYYY/MM/DD')
                          : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.applied_at ? dayjs(payment.applied_at).format('YYYY/MM/DD') : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.completed_at ? dayjs(payment.completed_at).format('YYYY/MM/DD') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pagination && data.pagination.total_pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn-secondary"
                >
                  前へ
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === (data?.pagination?.total_pages || 1)}
                  className="btn-secondary ml-3"
                >
                  次へ
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{data?.pagination?.total_count || 0}</span> 件中{' '}
                    <span className="font-medium">
                      {(page - 1) * 20 + 1}
                    </span>{' '}
                    から{' '}
                    <span className="font-medium">
                      {Math.min(page * 20, data?.pagination?.total_count || 0)}
                    </span>{' '}
                    件を表示
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {page} / {data?.pagination?.total_pages || 1}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === (data?.pagination?.total_pages || 1)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 決済詳細モーダル */}
      <PaymentDetailModal
        open={modalOpen}
        payment={selectedPayment}
        onClose={handleModalClose}
        onAccountingRequest={handleAccountingRequest}
      />
      
      {/* 新規決済作成モーダル */}
      <NewPaymentModal
        open={newPaymentModalOpen}
        onClose={() => setNewPaymentModalOpen(false)}
        onSuccess={() => {
          setNewPaymentModalOpen(false);
          // リストを更新
          window.location.reload();
        }}
      />
    </div>
    </DashboardLayout>
  );
}