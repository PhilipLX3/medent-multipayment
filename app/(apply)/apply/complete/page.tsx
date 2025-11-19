'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon, ClockIcon, DocumentTextIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/shared/components/layouts';

export default function ApplicationCompletePage() {
  const searchParams = useSearchParams();
  const applicationId = searchParams?.get('applicationId') || searchParams?.get('id') || null;
  const status = searchParams?.get('status') || 'pending';

  useEffect(() => {
    // 申込完了時の処理（必要に応じて）
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* 完了アイコンとメッセージ */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            お申込みが完了しました
          </h1>
          <p className="text-lg text-gray-600">
            ローン審査のお申込みを受け付けました
          </p>
          {applicationId && (
            <p className="mt-2 text-sm text-gray-500">
              申込番号: {applicationId}
            </p>
          )}
        </div>

        {/* 次のステップ */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
            今後の流れ
          </h2>
          <div className="space-y-4">
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-600">
                1
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-gray-900">審査開始</h3>
                <p className="text-sm text-gray-600">
                  提出いただいた情報を元に、ローン会社にて審査を行います。
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-600">
                2
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-gray-900">審査結果のご連絡</h3>
                <p className="text-sm text-gray-600">
                  通常、10分～30分程度で審査結果をメールまたはお電話にてご連絡いたします。
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-600">
                3
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-gray-900">ご契約手続き</h3>
                <p className="text-sm text-gray-600">
                  審査承認後、クリニックにてご契約手続きを行っていただきます。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            ご確認事項
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• 審査結果は、ご登録いただいたメールアドレスにお送りします</li>
            <li>• 迷惑メールフォルダもご確認ください</li>
            <li>• 審査状況により、追加の書類提出をお願いする場合があります</li>
            <li>• ご不明な点は、クリニックまでお問い合わせください</li>
          </ul>
        </div>

        {/* 連絡先 */}
        <div className="bg-gray-100 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <PhoneIcon className="h-5 w-5 mr-2" />
            お問い合わせ先
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">クリニック名:</span>{' '}
              <span className="text-gray-700">医療法人テスト歯科クリニック</span>
            </p>
            <p>
              <span className="font-medium">電話番号:</span>{' '}
              <a href="tel:03-1234-5678" className="text-primary-600 hover:text-primary-700">
                03-1234-5678
              </a>
            </p>
            <p>
              <span className="font-medium">受付時間:</span>{' '}
              <span className="text-gray-700">平日 9:00～18:00</span>
            </p>
          </div>
        </div>

        {/* ボタン */}
        <div className="text-center">
          <button
            onClick={() => window.close()}
            className="btn-secondary"
          >
            このページを閉じる
          </button>
          <p className="mt-4 text-sm text-gray-500">
            このページは安全に閉じていただいて構いません
          </p>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}