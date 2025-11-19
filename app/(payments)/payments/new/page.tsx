'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'react-query';
import { PaymentCreateRequest } from '@/types';
import toast from 'react-hot-toast';
import { LinkIcon, QrCodeIcon, DevicePhoneMobileIcon, ShareIcon, ArrowDownTrayIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import QRCode from 'react-qr-code';
import { firebaseSmsService } from '@/services/firebaseSmsService';
import { emailToSmsService } from '@/services/emailToSmsService';
import { paymentService } from '@/services/paymentService';
import { DashboardLayout } from '@/src/shared/components/layouts/DashboardLayout';

export default function NewPaymentPage() {
  const router = useRouter();
  const [showResult, setShowResult] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [smsMessage, setSmsMessage] = useState<string>('');
  const [sendingSms, setSendingSms] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'normal' | 'installment'>('normal');
  const [displayAmount, setDisplayAmount] = useState<string>('');
  
  // フォームの状態を管理
  const [formData, setFormData] = useState<PaymentCreateRequest>({
    patient_id: '',
    patient_name: '',
    patient_phone: '',
    treatment_name: '',
    amount: undefined,
    memo: ''
  });
  const [lastName, setLastName] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');

  // 数字にカンマを追加する関数
  const formatNumberWithCommas = (value: string): string => {
    // 数字以外を削除
    const numbers = value.replace(/[^0-9]/g, '');
    // カンマを追加
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // カンマを削除して数値に変換
  const parseFormattedNumber = (value: string): number | undefined => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? parseInt(numbers) : undefined;
  };

  // 金額入力時の処理
  const handleAmountChange = (value: string) => {
    const formatted = formatNumberWithCommas(value);
    setDisplayAmount(formatted);
    setFormData({...formData, amount: parseFormattedNumber(value)});
  };

  const createPaymentMutation = useMutation(
    async (data: PaymentCreateRequest) => {
      try {
        return await paymentService.createPayment(data);
      } catch (error) {
        // モック用：APIエラーでも成功として処理
        console.log('API error, using mock data for demo purposes');
        return {
          data: {
            payment_id: `MOCK-${Date.now()}`,
            payment_link: `${window.location.origin}/apply/mock-${Date.now()}`,
            patient_name: data.patient_name,
            amount: data.amount,
            treatment_name: data.treatment_name,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        };
      }
    },
    {
      onSuccess: (response: any) => {
        console.log('Payment response:', response);
        // APIレスポンスの構造に応じて適切にデータを取得
        let result: any = response.data;
        if (response.data && response.data.success && response.data.data) {
          result = response.data.data;
        } else if (response.data && response.data.data) {
          result = response.data.data;
        }
        console.log('Payment result:', result);
        
        // payment_linkが存在しない場合は警告を表示
        if (result && !result.payment_link) {
          console.error('Warning: payment_link not received from backend');
          // フォールバックとして payment_id を使用（本来は不要）
          if (result.payment_id) {
            result.payment_link = `${window.location.origin}/apply/${result.payment_id}`;
          }
        }
        
        setPaymentResult(result);
        setShowResult(true);
        toast.success('決済リンクを発行しました');
        // フォームをリセット
        setFormData({
          patient_id: '',
          patient_name: '',
          patient_phone: '',
          treatment_name: '',
          amount: undefined,
          memo: ''
        });
        setLastName('');
        setFirstName('');
        setDisplayAmount('');
        setPaymentType('normal');
      },
      onError: (error: any) => {
        // この onError は到達しない（エラーをキャッチして成功レスポンスに変換しているため）
        toast.error(error.response?.data?.error?.message || '決済リンクの発行に失敗しました');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requestData = {
      patient_id: formData.patient_id || undefined,
      patient_name: (lastName || firstName) ? `${lastName} ${firstName}`.trim() : undefined,
      patient_phone: formData.patient_phone || undefined,
      treatment_name: formData.treatment_name || undefined,
      amount: formData.amount || undefined,
      memo: formData.memo || undefined,
      payment_type: paymentType
    };
    createPaymentMutation.mutate(requestData as PaymentCreateRequest);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('クリップボードにコピーしました');
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('payment-qr-code');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `payment-qr-${paymentResult.payment_id}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const shareUrl = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '決済申込みリンク',
          text: `${paymentResult.patient_name || '患者'}様の決済申込みリンクです。`,
          url: paymentResult.payment_link,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      copyToClipboard(paymentResult.payment_link);
    }
  };

  const sendSms = async () => {
    // 電話番号のバリデーション
    if (!firebaseSmsService.validatePhoneNumber(phoneNumber)) {
      toast.error('有効な電話番号を入力してください');
      return;
    }

    setSendingSms(true);
    try {
      // Firebase Cloud Functions経由でSMS送信
      await firebaseSmsService.sendCustomSms(phoneNumber, smsMessage);
      
      toast.success('SMSを送信しました');
      setShowSmsModal(false);
      setPhoneNumber('');
      setSmsMessage('');
      setSelectedCarrier('');
    } catch (error: any) {
      // エラー時はメールゲートウェイにフォールバック
      console.log('Firebase SMS失敗、メールゲートウェイを使用');
      emailToSmsService.openEmailClient(phoneNumber, smsMessage, selectedCarrier);
      toast.success('メールアプリが開きました。送信ボタンを押してSMSを送信してください。');
      setShowSmsModal(false);
    } finally {
      setSendingSms(false);
    }
  };


  if (showResult && paymentResult) {
    return (
      <DashboardLayout>
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">決済リンク発行完了</h1>
          </div>

        <div className="card max-w-4xl mx-auto">
          <div className="card-body">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <LinkIcon className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                患者様用 決済リンク発行完了
              </h2>
              <p className="text-gray-600">
                以下の方法で患者様に決済リンクをご案内ください。
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 左側：QRコードと基本情報 */}
              <div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      {paymentResult && paymentResult.payment_link ? (
                        <QRCode
                          id="payment-qr-code"
                          value={paymentResult.payment_link}
                          size={200}
                          level="H"
                        />
                      ) : (
                        <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 text-gray-500">
                          <p className="text-center text-sm">
                            QRコード生成中...<br/>
                            {!paymentResult && 'データなし'}<br/>
                            {paymentResult && !paymentResult.payment_link && 'リンクなし'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500">決済ID: {paymentResult.payment_id}</p>
                    {paymentResult.patient_name && (
                      <p className="text-sm text-gray-600">患者名: {paymentResult.patient_name}</p>
                    )}
                    {paymentResult.amount && (
                      <p className="text-lg font-semibold text-gray-900">
                        ¥{paymentResult.amount.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      有効期限: {new Date(paymentResult.expires_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 右側：共有オプション */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">患者様への案内方法</h3>
                
                {/* 患者デバイスで申込む場合 */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">① 患者様のデバイスで申込む</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSmsMessage(`【決済申込みのご案内】\n${paymentResult.patient_name || ''}様\n\n下記リンクより決済申込みをお願いします。\n${paymentResult.payment_link}\n\n有効期限: ${new Date(paymentResult.expires_at).toLocaleDateString('ja-JP')}`);
                        setShowSmsModal(true);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <span className="flex items-center">
                        <DevicePhoneMobileIcon className="w-5 h-5 mr-2" />
                        SMSで送信
                      </span>
                      <span className="text-xs">推奨</span>
                    </button>
                    
                    {/* <button
                      onClick={shareUrl}
                      className="w-full flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ShareIcon className="w-5 h-5 mr-2" />
                      URLを共有
                    </button> */}
                    
                    <button
                      onClick={downloadQRCode}
                      className="w-full flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                      QRコードをダウンロード
                    </button>
                  </div>
                </div>

                {/* クリニックデバイスで申込む場合 */}
                {/* <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">② クリニックのデバイスで申込む</h4>
                  <button
                    onClick={() => {
                      // payment_linkからlinkIdを抽出
                      const linkId = paymentResult.payment_link.split('/').pop();
                      // 申込画面へ遷移
                      window.location.href = `/apply/${linkId}`;
                    }}
                    className="w-full flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <QrCodeIcon className="w-5 h-5 mr-2" />
                    申込画面を開く
                  </button>
                </div> */}

                {/* URL直接コピー */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">決済リンク</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={paymentResult?.payment_link || 'リンク生成中...'}
                      className="flex-1 input-field text-sm"
                    />
                    <button
                      onClick={() => paymentResult?.payment_link && copyToClipboard(paymentResult.payment_link)}
                      className="btn-secondary py-2 px-3 text-sm"
                      disabled={!paymentResult?.payment_link}
                    >
                      コピー
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="flex space-x-3 mt-6">
              <button
                disabled
                className="flex-1 btn-primary opacity-50 cursor-not-allowed"
                title="この機能は現在利用できません"
              >
                本申込み画面へ（準備中）
              </button>
              <button
                onClick={() => router.push('/payments')}
                className="flex-1 btn-secondary"
              >
                決済一覧へ
              </button>
            </div> */}
          </div>
        </div>

        {/* reCAPTCHA用の非表示div */}
        <div id="recaptcha-container"></div>

        {/* SMS送信モーダル */}
        {showSmsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS送信</h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start">
                    <EnvelopeIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">メール to SMS 送信</p>
                      <p className="text-xs">各キャリアのメールゲートウェイ経由でSMSを送信します。</p>
                      <p className="text-xs mt-1">※送信は無料ですが、患者様のキャリア設定により届かない場合があります。</p>
                    </div>
                  </div>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="input-field"
                    placeholder="090-1234-5678"
                  />
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    携帯キャリア（わかる場合）
                  </label>
                  <select
                    value={selectedCarrier}
                    onChange={(e) => setSelectedCarrier(e.target.value)}
                    className="input-field"
                  >
                    {emailToSmsService.getCarriers().map(carrier => (
                      <option key={carrier.value} value={carrier.value}>
                        {carrier.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    不明な場合は全キャリアに送信されます
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メッセージ
                  </label>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    rows={6}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {smsMessage.length} 文字
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowSmsModal(false)}
                  className="flex-1 btn-secondary"
                  disabled={sendingSms}
                >
                  キャンセル
                </button>
                <button
                  onClick={sendSms}
                  className="flex-1 btn-primary"
                  disabled={!phoneNumber || !smsMessage || sendingSms}
                >
                  {sendingSms ? '送信中...' : '送信'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 新規作成ボタン */}
        {/* <div className="mt-6 text-center">
          <button
            onClick={() => {
              setShowResult(false);
              setPaymentResult(null);
            }}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <LinkIcon className="w-5 h-5 mr-2" />
            新規決済リンクを作成
          </button>
        </div> */}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">新規決済依頼</h1>
        </div>

      <div className="card max-w-2xl">
        <div className="card-body">
          {/* 説明文 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>全ての項目は任意入力です。</strong>
              何も入力せずに「次へ」ボタンを押すことができます。患者様の情報は後から申込み画面で入力可能です。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700">
                患者ID (任意)
              </label>
              <input
                type="text"
                value={formData.patient_id || ''}
                onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                className="input-field"
                placeholder="00123"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  姓 (任意)
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="山田"
                />
              </div>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  名 (任意)
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="太郎"
                />
              </div>
            </div>

            {/* <div>
              <label htmlFor="patient_phone" className="block text-sm font-medium text-gray-700">
                患者電話番号 (SMS送信用)
              </label>
              <input
                type="text"
                value={formData.patient_phone || ''}
                onChange={(e) => setFormData({...formData, patient_phone: e.target.value})}
                className="input-field"
                placeholder="090-1234-5678 または 09012345678"
              />
            </div> */}

            <div>
              <label htmlFor="treatment_name" className="block text-sm font-medium text-gray-700">
                治療名 (任意)
              </label>
              <input
                type="text"
                id="treatment_name"
                value={formData.treatment_name || ''}
                onChange={(e) => setFormData({...formData, treatment_name: e.target.value})}
                className="input-field"
                placeholder="インプラント"
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                金額 (円) (任意)
              </label>
              <input
                type="text"
                id="amount"
                value={displayAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="input-field"
                placeholder="5,000,000"
              />
            </div>

            <div>
              <label htmlFor="memo" className="block text-sm font-medium text-gray-700">
                メモ (任意)
              </label>
              <textarea
                value={formData.memo || ''}
                onChange={(e) => setFormData({...formData, memo: e.target.value})}
                rows={3}
                className="input-field"
                placeholder="備考や注意事項など"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/payments')}
                className="btn-secondary"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={createPaymentMutation.isLoading}
                className="btn-primary"
              >
                {createPaymentMutation.isLoading ? '次へ' : '次へ'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}