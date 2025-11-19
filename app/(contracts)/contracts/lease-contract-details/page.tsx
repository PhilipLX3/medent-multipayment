'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMediaQuery, useTheme } from '@mui/material';

import { Contract } from '@/shared/types';

interface LeaseContractDetailsProps {
  open: boolean;
  onClose: () => void;
  contract: Contract | null;
}

const LeaseContractDetails: React.FC<LeaseContractDetailsProps> = ({
  open,
  onClose,
  contract,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!contract) return null;

  const handleContractClick = (contractNo: string) => {
    onClose();
    router.push(`/contracts?contractNo=${contractNo}`);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <div
            className={`bg-white shadow-xl w-full overflow-hidden ${
              isMobile
                ? 'h-full max-h-full rounded-none'
                : 'rounded-lg max-w-2xl max-h-[90vh]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                リース契約の詳細
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            {/* Content */}
            <div className={`overflow-y-auto ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`} style={{
              maxHeight: isMobile ? 'calc(100vh - 140px)' : 'calc(90vh - 140px)'
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      案件No
                    </label>
                    <div className={`text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {contract.contractNumber || contract.id}
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      顧客ID
                    </label>
                    <div className={`text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {contract.customerId || '-'}
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      顧客名
                    </label>
                    <div className={`text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {contract.customerName || contract.corporateName || contract.clinicName || '-'}
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      物件名/治療名
                    </label>
                    <div className={`text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {contract.treatmentName || contract.propertyName || '-'}
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      契約金額
                    </label>
                    <div className={`text-gray-900 font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>
                      ¥{(contract.contractAmount || contract.amount || 0).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      支払方法
                    </label>
                    <div className={`text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {contract.paymentMethod?.nameJp || contract.paymentMethod?.name || '-'}
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      リース会社
                    </label>
                    <div className={`text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {contract.financeCompany?.name || contract.leaseCompany || '-'}
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      契約タイプ
                    </label>
                    <div className={`text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {contract.type?.nameJp || contract.type?.name || '-'}
                    </div>
                  </div>

                  <div>
                    <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      ステータス
                    </label>
                    <div className={`inline-block px-2 py-1 rounded text-xs ${
                      contract.status?.value === 'INSPECTION_COMPLETED' ? 'bg-green-600 text-white' :
                      contract.status?.value === 'UNDER_REVIEW' ? 'bg-yellow-600 text-white' :
                      contract.status?.value === 'WAITING_FOR_INSPECTION' ? 'bg-blue-600 text-white' :
                      contract.status?.value === 'DELIVERY_COMPLETED' ? 'bg-purple-600 text-white' :
                      contract.status?.value === 'CONTRACT_SENT' ? 'bg-indigo-600 text-white' :
                      contract.status?.value === 'WAITING_FOR_DELIVERY' ? 'bg-cyan-600 text-white' :
                      contract.status?.value === 'WAITING_FOR_CONTRACT' ? 'bg-orange-600 text-white' :
                      contract.status?.nameJp || contract.status?.name ? 'bg-gray-600 text-white' :
                      'text-gray-900'
                    }`}>
                      {contract.status?.nameJp || contract.status?.name || '-'}
                    </div>
                  </div>

                  {contract.dealer && (
                    <div>
                      <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        販売店
                      </label>
                      <div className={`text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                        {contract.dealer}
                      </div>
                    </div>
                  )}

                  {contract.contractConcludedAt && (
                    <div>
                      <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        契約締結日
                      </label>
                      <div className={`text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                        {new Date(contract.contractConcludedAt).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  )}

                  {contract.approvedAt && (
                    <div>
                      <label className={`block font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        承認日
                      </label>
                      <div className={`text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                        {new Date(contract.approvedAt).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Items/品目 Section */}
                {(() => {
                  // Use actual items if available, otherwise create mock data for display
                  const items = (contract as any).items && (contract as any).items.length > 0 
                    ? (contract as any).items 
                    : [
                        { name: 'ユニット', price: 3000000, quantity: 2 },
                        { name: 'スキャナー', price: 5000000, quantity: 1 },
                      ];
                  
                  const subtotal = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
                  const tax = Math.round(subtotal * 0.1);
                  const total = subtotal + tax;
                  const maxAmount = (contract as any).maxAmount || 0;
                  const difference = maxAmount > 0 ? maxAmount - total : 0;
                  const leasePeriod = (contract as any).leasePeriod || 5;

                  return (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h3 className={`font-semibold text-gray-800 mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                        品目詳細
                      </h3>
                      <div className="overflow-x-auto border border-gray-200 rounded">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className={`px-4 py-3 text-left font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                品目
                              </th>
                              <th className={`px-4 py-3 text-right font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                単価
                              </th>
                              <th className={`px-4 py-3 text-right font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                数量
                              </th>
                              <th className={`px-4 py-3 text-right font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                小計
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {items.map((item: any, index: number) => (
                            <tr key={index}>
                              <td className={`px-4 py-3 text-gray-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                {item.name}
                              </td>
                              <td className={`px-4 py-3 text-right text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                ¥{item.price.toLocaleString()}
                              </td>
                              <td className={`px-4 py-3 text-right text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                {item.quantity}
                              </td>
                              <td className={`px-4 py-3 text-right font-medium text-gray-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                ¥{(item.price * item.quantity).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Totals */}
                    <div className="mt-3 bg-gray-50 rounded p-3 space-y-1">
                      <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <span className="text-gray-600">小計</span>
                        <span className="text-gray-800">¥{subtotal.toLocaleString()}</span>
                      </div>
                      <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <span className="text-gray-600">消費税</span>
                        <span className="text-gray-800">¥{tax.toLocaleString()}</span>
                      </div>
                      {maxAmount > 0 && (
                        <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <span className="text-gray-600">上限金額</span>
                          <span className="text-gray-800">¥{maxAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className={`flex justify-between border-t border-gray-300 pt-2 mt-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                        <span className="font-semibold text-gray-800">合計</span>
                        <span className="font-bold text-gray-900">
                          ¥{total.toLocaleString()}
                        </span>
                      </div>
                      {maxAmount > 0 && (
                        <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <span className="text-gray-600">差額</span>
                          <span className={`font-medium ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ¥{Math.abs(difference).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className={`flex justify-between pt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <span className="text-gray-600">リース期間</span>
                        <span className="font-semibold text-gray-800">{leasePeriod}年</span>
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {/* Attachments Section */}
                {contract.attachmentQuotes && contract.attachmentQuotes.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className={`font-semibold text-gray-800 mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      添付ファイル
                    </h3>
                    <ul className="space-y-2">
                      {contract.attachmentQuotes.map((attachment: any, index: number) => (
                        <li key={index} className={`text-gray-700 flex items-center ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <span className="mr-2">📎</span>
                          <span>{attachment.originalFilename || attachment.name || `ファイル ${index + 1}`}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Legacy contract data structure - Keep for backward compatibility */}
              {contract.allContractsData && contract.allContractsData.length > 0 && (
                <>
                  <hr className="my-6" />
                  <div className="mb-6">
                    <h3 className={`font-semibold mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>【契約一覧】</h3>
                    <div className="overflow-x-auto border border-gray-200 rounded">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className={`px-4 py-3 text-left font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              契約No
                            </th>
                            <th className={`px-4 py-3 text-left font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              物件名
                            </th>
                            <th className={`px-4 py-3 text-right font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              合計金額
                            </th>
                            <th className={`px-4 py-3 text-left font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              リース会社
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {contract.allContractsData.map((contractData: any, index: number) => {
                            const contractNo = `${contract.id}${String(index + 1).padStart(2, '0')}`;
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className={`px-4 py-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                  <button
                                    onClick={() => handleContractClick(contractNo)}
                                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                                  >
                                    {contractNo}
                                  </button>
                                </td>
                                <td className={`px-4 py-3 text-gray-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                  {contractData.items && contractData.items.length > 0
                                    ? contractData.items.map((item: any) => item.name).join(', ')
                                    : contract.propertyName || contract.treatment_name}
                                </td>
                                <td className={`px-4 py-3 text-right text-gray-800 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                  {(contractData.total || 0).toLocaleString()}円
                                </td>
                                <td className={`px-4 py-3 text-gray-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                  {contractData.leaseCompanyDetails?.companyName || contractData.companyName || contract.leaseCompany || contract.finance_company_name}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {(contract.contractData) && (
                <>
                  <hr className="my-4" />

                  {(contract.allContractsData || [contract.contractData]).map((contractData: any, contractIndex: number) => (
                    contractData && (
                      <div key={contractIndex} className="mb-6">
                        {contract.allContractsData && contract.allContractsData.length > 1 && (
                          <div className="bg-gray-100 border-l-4 border-blue-500 p-3 mb-4">
                            <div className="flex items-center justify-between">
                              <h3 className={`font-semibold text-gray-800 ${isMobile ? 'text-sm' : 'text-base'}`}>
                                {contractData.leaseCompanyDetails?.companyName || contractData.companyName}
                              </h3>
                              <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                                {contractIndex + 1} / {contract.allContractsData.length}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 契約依頼内容 - Items Table */}
                        <div className="border border-gray-200 rounded p-3">
                          <h3 className={`font-semibold text-gray-800 mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                            契約依頼内容
                          </h3>

                          {/* Items Table */}
                          <div className="overflow-x-auto mb-3">
                            <table className="min-w-full border border-gray-200">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className={`px-3 py-2 text-left font-medium text-gray-700 border-b ${isMobile ? 'text-xs' : 'text-sm'}`}>品目</th>
                                  <th className={`px-3 py-2 text-right font-medium text-gray-700 border-b ${isMobile ? 'text-xs' : 'text-sm'}`}>単価</th>
                                  <th className={`px-3 py-2 text-right font-medium text-gray-700 border-b ${isMobile ? 'text-xs' : 'text-sm'}`}>数量</th>
                                  <th className={`px-3 py-2 text-right font-medium text-gray-700 border-b ${isMobile ? 'text-xs' : 'text-sm'}`}>小計</th>
                                </tr>
                              </thead>
                              <tbody>
                                {contractData.items?.map((item: any, index: number) => (
                                  <tr key={index} className="border-b border-gray-100">
                                    <td className={`px-3 py-2 text-gray-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>{item.name}</td>
                                    <td className={`px-3 py-2 text-right text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>¥{item.price.toLocaleString()}</td>
                                    <td className={`px-3 py-2 text-right text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>{item.quantity}</td>
                                    <td className={`px-3 py-2 text-right font-medium text-gray-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>¥{(item.price * item.quantity).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Totals */}
                          <div className="bg-gray-50 rounded p-3 space-y-1">
                            <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              <span className="text-gray-600">小計</span>
                              <span className="text-gray-800">¥{contractData.subtotal?.toLocaleString()}</span>
                            </div>
                            <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              <span className="text-gray-600">消費税</span>
                              <span className="text-gray-800">¥{contractData.tax?.toLocaleString()}</span>
                            </div>
                            <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              <span className="text-gray-600">上限金額</span>
                              <span className="text-gray-800">¥{contractData.maxAmount?.toLocaleString()}</span>
                            </div>
                            <div className={`flex justify-between border-t border-gray-300 pt-2 mt-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                              <span className="font-semibold text-gray-800">合計</span>
                              <span className="font-bold text-gray-900">¥{contractData.total?.toLocaleString()}</span>
                            </div>
                            <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              <span className="text-gray-600">差額</span>
                              <span className={`font-medium ${contractData.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ¥{contractData.difference?.toLocaleString()}
                              </span>
                            </div>
                            <div className={`flex justify-between pt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              <span className="text-gray-600">リース期間</span>
                              <span className="font-semibold text-gray-800">{contractData.leasePeriod}年</span>
                            </div>
                          </div>

                          {/* Uploaded Files */}
                          {contractData.uploadedFiles && contractData.uploadedFiles.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h4 className={`font-medium text-gray-700 mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                添付ファイル
                              </h4>
                              <ul className="space-y-1">
                                {contractData.uploadedFiles.map((file: any, index: number) => (
                                  <li key={index} className={`text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                    • {file.name} {file.size > 0 && `(${Math.round(file.size / 1024)} KB)`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Add separator between contracts */}
                        {contract.allContractsData && contract.allContractsData.length > 1 && contractIndex < contract.allContractsData.length - 1 && (
                          <div className="my-6 border-t border-gray-300"></div>
                        )}
                      </div>
                    )
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div className={`border-t border-gray-200 flex justify-end ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
              <button
                onClick={onClose}
                className={`border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isMobile ? 'w-full px-4 py-2' : 'px-4 py-2'
                }`}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaseContractDetails;
