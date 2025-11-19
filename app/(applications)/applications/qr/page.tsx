'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import * as QRCodeLib from 'qrcode';
import { applicationService } from '@/applications/_services';
import { ApplicationResponse } from '@/shared/types/application';
import toast from 'react-hot-toast';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function ApplicationQRPage() {
  const router = useRouter();
  const [applicationData, setApplicationData] = useState<ApplicationResponse | null>(null);
  const [email, setEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const generateQrCodeUrl = (appData: any): string | null => {
    if (appData.qrCodeUrl) {
      return appData.qrCodeUrl; // Return existing URL if present
    }
    
    const id = appData.uuid || appData.applicationId;
    if (id) {
      // Derive domain from API base 
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-api.medent-finance.com/api';
      const domain = apiBaseUrl
        .replace('/api', '')
        .replace('-api', '');

      return `${domain}/applications/lease-screening?id=${id}`;
    }
    
    return null; // No ID available to generate URL
  };

  useEffect(() => {
    const loadApplicationData = async () => {
      const storedData = localStorage.getItem('applicationData');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          if (parsed.uuid) {
            // Fetch the latest application data from API
            const response = await applicationService.getById(parsed.uuid);
            if (response.data?.data) {
              const appData = response.data.data;
              
              const mergedData = {
                ...parsed,
                ...appData,
                businessType: parsed.businessType || appData.businessType,
                corporateName: appData.corporateName || parsed.businessName || parsed.corporateName
              };
              
              const generatedUrl = generateQrCodeUrl(mergedData);
              if (generatedUrl) {
                mergedData.qrCodeUrl = generatedUrl;
              }
              
              setApplicationData(mergedData);
            }
          } else {
            // Fallback to stored data for older implementations
            const appData = {
              ...parsed,
              corporateName: parsed.corporateName || parsed.businessName,
              businessType: parsed.businessType
            };
            
            const generatedUrl = generateQrCodeUrl(appData);
            if (generatedUrl) {
              appData.qrCodeUrl = generatedUrl;
            }
            
            setApplicationData(appData);
          }
        } catch (error) {
          console.error('Error loading application data:', error);
        }
      }
      setIsLoading(false);
    };

    loadApplicationData();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleEmailSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationData?.uuid) return;
    
    setIsSendingEmail(true);
    try {
      await applicationService.sendToClinic(applicationData.uuid, { email });
      toast.success(`メールが ${email} に送信されました`);
      setEmail('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('メール送信に失敗しました');
    } finally {
      setIsSendingEmail(false);
    }
  };

    const handleCopyUrl = () => {
    if (!applicationData?.qrCodeUrl) return;
    
    navigator.clipboard.writeText(applicationData.qrCodeUrl);
    toast.success('URLがクリップボードにコピーされました');
  };

  const handleDownload = async () => {
    if (!applicationData?.qrCodeUrl) return;
    
    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      
      // Generate QR code directly to canvas
      await QRCodeLib.toCanvas(canvas, applicationData.qrCodeUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Convert canvas to data URL
      const dataURL = canvas.toDataURL('image/png');
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = dataURL;
      downloadLink.download = `qr-code-${applicationData.applicationNumber || 'application'}.png`;
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success('QRコードがダウンロードされました');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('QRコードのダウンロードに失敗しました');
    }
  };

  const formatNumberWithCommas = (value: number): string => {
    return value.toLocaleString();
  };

  const handleDirectApplication = () => {
    router.push('/applications/lease-screening');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">申込みシェア</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:items-stretch">
        <div className="card">
          <div className="card-body">
            <div
              className="flex justify-between items-center cursor-pointer md:cursor-default mb-4"
              onClick={() => setIsInfoExpanded(!isInfoExpanded)}
            >
              <h2 className="text-lg font-semibold text-gray-900">申込情報</h2>
              <button className="md:hidden">
                {isInfoExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>

            <div className={`${isInfoExpanded ? 'block' : 'hidden'} md:block`}>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">読み込み中...</p>
                </div>
              ) : applicationData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <label className="text-sm text-gray-600">申込番号:</label>
                    <div className="md:col-span-3 text-sm font-mono">
                      {applicationData.applicationNumber}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <label className="text-sm text-gray-600">顧客ID:</label>
                    <div className="md:col-span-3 text-sm">
                      {applicationData.customerId || '-'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <label className="text-sm text-gray-600">
                      {(applicationData as any).businessType === 'Corporation' ? '法人名' : 
                       (applicationData as any).businessType === 'Individual' ? '代表者名' : 
                       '法人名'}:
                    </label>
                    <div className="md:col-span-3 text-sm">
                      {applicationData.corporateName || (applicationData as any).businessName || '-'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <label className="text-sm text-gray-600">医院名:</label>
                    <div className="md:col-span-3 text-sm">
                      {applicationData.clinicName || '-'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <label className="text-sm text-gray-600">物件名:</label>
                    <div className="md:col-span-3 text-sm">
                      {applicationData.propertyName || '-'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <label className="text-sm text-gray-600">金額:</label>
                    <div className="md:col-span-3 text-sm">
                      {applicationData.amount ? `${formatNumberWithCommas(applicationData.amount)}円(税抜)` : '-'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <label className="text-sm text-gray-600">担当者名:</label>
                    <div className="md:col-span-3 text-sm">
                      {applicationData.picName || '-'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">申込データが見つかりません</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card h-full">
          <div className="card-body flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">申込みシェア</h2>
              <div className="py-4"></div>
            <div className="mb-4">
              <form onSubmit={handleEmailSend} className="flex space-x-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email"
                  className="input-field flex-1"
                  required
                />
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="btn-primary w-32 disabled:opacity-50"
                >
                  {isSendingEmail ? '送信中...' : '送信'}
                </button>
              </form>
            </div>

            {applicationData?.qrCodeUrl && (
              <div className="mb-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={applicationData.qrCodeUrl}
                    readOnly
                    className="input-field flex-1"
                  />
                  <button onClick={handleCopyUrl} className="btn-secondary w-32">コピー</button>
                </div>
              </div>
            )}

            {applicationData?.qrCodeUrl && (
              <div className="relative mb-6">
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                    <QRCode
                      id="application-qr-code"
                      value={applicationData.qrCodeUrl}
                      size={isMobile ? 220 : 150}
                      level="H"
                      className="w-full h-auto max-w-[220px] md:max-w-[150px]"
                    />
                  </div>
                </div>
                <div className="flex justify-center">
                  <button onClick={handleDownload} className="btn-secondary w-32">
                    ダウンロード
                  </button>
                </div>
              </div>
            )}
            </div>

            <div className="w-full">
              <button onClick={handleDirectApplication} className="btn-primary w-full">
                このまま申込む
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
