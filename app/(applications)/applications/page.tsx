'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { applicationService } from '@/applications/_services';
import { ApplicationResponse, ApplicationFilters } from '@/shared/types/application';
import { ProtectedRoute } from '@/shared/components';

export default function ApplicationsListPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<ApplicationFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
  });

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await applicationService.getAll(filters);
      if (response.data?.data) {
        setApplications(response.data.data.data);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filters]);

  const handleNewApplication = () => {
    router.push('/applications/new');
  };

  const handleViewApplication = (uuid: string) => {
    router.push(`/applications/${uuid}`);
  };

  const handleDeleteApplication = async (uuid: string) => {
    if (confirm('この申込を削除しますか？')) {
      try {
        await applicationService.delete(uuid);
        fetchApplications(); // Refresh list
      } catch (error) {
        console.error('Error deleting application:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const handleSendToClinic = async (uuid: string) => {
    const email = prompt('送信先のメールアドレスを入力してください:');
    if (email) {
      try {
        await applicationService.sendToClinic(uuid, { email });
        alert('メールを送信しました');
      } catch (error) {
        console.error('Error sending email:', error);
        alert('メール送信に失敗しました');
      }
    }
  };

  const formatAmount = (amount: number) => {
    return amount?.toLocaleString() || '-';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'text-gray-500 bg-gray-100';
      case 'ready_to_submit': return 'text-blue-600 bg-blue-100';
      case 'submitted': return 'text-green-600 bg-green-100';
      case 'pending_clinic': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <ProtectedRoute>
      <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">申込一覧</h1>
        <button
          onClick={handleNewApplication}
          className="btn-primary"
        >
          新規申込
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="申込番号"
              className="input-field"
              value={filters.applicationNumber || ''}
              onChange={(e) => setFilters({ ...filters, applicationNumber: e.target.value })}
            />
            <input
              type="text"
              placeholder="医院名"
              className="input-field"
              value={filters.clinicName || ''}
              onChange={(e) => setFilters({ ...filters, clinicName: e.target.value })}
            />
            <input
              type="text"
              placeholder="法人名"
              className="input-field"
              value={filters.corporateName || ''}
              onChange={(e) => setFilters({ ...filters, corporateName: e.target.value })}
            />
            <button
              onClick={() => setFilters({ ...filters, page: 1 })}
              className="btn-secondary"
            >
              検索
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">読み込み中...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">申込が見つかりません</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        申込番号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        医院名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        法人名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        物件名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        金額
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((app) => (
                      <tr key={app.uuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {app.applicationNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {app.clinicName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {app.corporateName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {app.propertyName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatAmount(app.amount)}円
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(app.status.enumValue)}`}>
                            {app.status.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewApplication(app.uuid)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            詳細
                          </button>
                          <button
                            onClick={() => handleSendToClinic(app.uuid)}
                            className="text-green-600 hover:text-green-900"
                          >
                            送信
                          </button>
                          <button
                            onClick={() => handleDeleteApplication(app.uuid)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1}～{Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                    disabled={pagination.page <= 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    前へ
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-500">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    次へ
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
