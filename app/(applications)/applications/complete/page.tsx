'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ApplicationCompletePage() {
  const router = useRouter();
  const [applicationData, setApplicationData] = useState<any>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        setIsAuthenticated(authData.state?.isAuthenticated || false);
      } catch (error) {
        console.error('Error parsing auth data:', error);
        setIsAuthenticated(false);
      }
    }

    // Get data from localStorage
    const storedData = localStorage.getItem('applicationData');
    if (storedData) {
      try {
        setApplicationData(JSON.parse(storedData));
      } catch (error) {
        console.error('Error parsing application data:', error);
      }
    }
  }, []);

  const handleReturnToDashboard = () => {
    router.push('/projects');
  };

  return (
    <div className="flex flex-col items-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">申込完了</h1>
          <p className="text-gray-600">申込みが正常に完了しました。</p>
        </div>

        <div className="space-y-4 mb-8">
          {applicationData.companyName && (
            <div>
              <p className="text-sm text-gray-500">法人名</p>
              <p className="font-medium">{applicationData.companyName}</p>
            </div>
          )}

          {applicationData.hospitalName && (
            <div>
              <p className="text-sm text-gray-500">医院名</p>
              <p className="font-medium">{applicationData.hospitalName}</p>
            </div>
          )}

          {applicationData.hospitalAddress && (
            <div>
              <p className="text-sm text-gray-500">医院住所</p>
              <p className="font-medium">{applicationData.hospitalAddress}</p>
            </div>
          )}

          {applicationData.representativeAddress && (
            <div>
              <p className="text-sm text-gray-500">代表者住所</p>
              <p className="font-medium">{applicationData.representativeAddress}</p>
            </div>
          )}

          {applicationData.propertyName && (
            <div>
              <p className="text-sm text-gray-500">物件名</p>
              <p className="font-medium">{applicationData.propertyName}</p>
            </div>
          )}

          {applicationData.amount && (
            <div>
              <p className="text-sm text-gray-500">金額</p>
              <p className="font-medium">{applicationData.amount} 円(税抜)</p>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-3">
          {isAuthenticated ? (
            <>
              <button
                onClick={handleReturnToDashboard}
                className="btn-primary py-2"
              >
                案件一覧に戻る
              </button>
              
              <Link href="/applications/new" className="btn-secondary py-2 text-center">
                新しい申込を作成
              </Link>
            </>
          ) : (
            <Link href="/applications/lease-screening" className="btn-primary py-2 text-center">
              新しい申込を作成
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}