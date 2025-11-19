import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, LinkIcon, QrCodeIcon, DevicePhoneMobileIcon, ShareIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { paymentService } from '@/services/paymentService';
import { PaymentCreateRequest } from '@/types';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { firebaseSmsService } from '@/services/firebaseSmsService';
import { emailToSmsService } from '@/services/emailToSmsService';

interface NewPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewPaymentModal({ open, onClose, onSuccess }: NewPaymentModalProps) {
  const [showResult, setShowResult] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [smsMessage, setSmsMessage] = useState<string>('');
  const [sendingSms, setSendingSms] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentCreateRequest>();

  const createPaymentMutation = useMutation(
    (data: PaymentCreateRequest) => paymentService.createPayment(data),
    {
      onSuccess: (response) => {
        const result = response.data.data;
        setPaymentResult(result);
        setShowResult(true);
        toast.success('決済リンクを発行しました');
        reset();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || '決済リンクの発行に失敗しました');
      },
    }
  );

  const onSubmit = (data: PaymentCreateRequest) => {
    createPaymentMutation.mutate(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('クリップボードにコピーしました');
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('payment-qr-code-modal');
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
    if (!firebaseSmsService.validatePhoneNumber(phoneNumber)) {
      toast.error('有効な電話番号を入力してください');
      return;
    }

    setSendingSms(true);
    try {
      await firebaseSmsService.sendCustomSms(phoneNumber, smsMessage);
      toast.success('SMSを送信しました');
      setShowSmsModal(false);
      setPhoneNumber('');
      setSmsMessage('');
      setSelectedCarrier('');
    } catch (error: any) {
      console.log('Firebase SMS失敗、メールゲートウェイを使用');
      emailToSmsService.openEmailClient(phoneNumber, smsMessage, selectedCarrier);
      toast.success('メールアプリが開きました。送信ボタンを押してSMSを送信してください。');
      setShowSmsModal(false);
    } finally {
      setSendingSms(false);
    }
  };

  const handleClose = () => {
    setShowResult(false);
    setPaymentResult(null);
    reset();
    onClose();
  };

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        {showResult ? '決済リンク発行完了' : '新規決済依頼'}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                        onClick={handleClose}
                      >
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    {!showResult ? (
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700">
                              患者ID *任意
                            </label>
                            <input
                              {...register('patient_id')}
                              type="text"
                              className="input-field"
                              placeholder="00123"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="patient_name" className="block text-sm font-medium text-gray-700">
                              氏名
                            </label>
                            <div className="flex space-x-2">
                              <input
                                {...register('patient_name')}
                                type="text"
                                className="input-field flex-1"
                                placeholder="姓"
                              />
                              <input
                                type="text"
                                className="input-field flex-1"
                                placeholder="名"
                              />
                            </div>
                            <p className="text-xs text-red-500 mt-1">*任意</p>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="treatment_name" className="block text-sm font-medium text-gray-700">
                            治療名
                          </label>
                          <select
                            {...register('treatment_name')}
                            className="input-field"
                          >
                            <option value="">選択してください</option>
                            <option value="インプラント">インプラント</option>
                            <option value="矯正治療">矯正治療</option>
                            <option value="審美治療">審美治療</option>
                            <option value="その他">その他</option>
                          </select>
                          <p className="text-xs text-red-500 mt-1">*任意（プルダウンで選択orフリーテキスト）</p>
                        </div>

                        <div>
                          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                            金額
                          </label>
                          <div className="flex items-center">
                            <input
                              {...register('amount', {
                                min: { value: 1, message: '1円以上の金額を入力してください' },
                                max: { value: 10000000, message: '10,000,000円以下の金額を入力してください' },
                              })}
                              type="number"
                              className="input-field flex-1"
                              placeholder="500000"
                            />
                            <span className="ml-2 text-gray-500">円(税込)</span>
                          </div>
                          <p className="text-xs text-red-500 mt-1">*任意</p>
                          {errors.amount && (
                            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                          )}
                        </div>

                        <div className="flex justify-center mt-6">
                          <button
                            type="submit"
                            disabled={createPaymentMutation.isLoading}
                            className="btn-primary px-8 py-3"
                          >
                            {createPaymentMutation.isLoading ? '発行中...' : '次へ'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* 左側：QRコードと基本情報 */}
                          <div>
                            <div className="bg-gray-50 rounded-lg p-6">
                              <div className="flex justify-center mb-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                  <QRCode
                                    id="payment-qr-code-modal"
                                    value={paymentResult.payment_link}
                                    size={200}
                                    level="H"
                                  />
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
                                    SMS配信
                                  </span>
                                </button>
                                
                                <button
                                  onClick={() => copyToClipboard(paymentResult.payment_link)}
                                  className="w-full flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <LinkIcon className="w-5 h-5 mr-2" />
                                  URLコピー
                                </button>
                                
                                <button
                                  onClick={downloadQRCode}
                                  className="w-full flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                                  QRコードダウンロード
                                </button>
                              </div>
                            </div>

                            {/* クリニックデバイスで申込む場合 */}
                            <div className="border rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-3">② このまま申し込む</h4>
                              <button
                                onClick={() => window.open(paymentResult.payment_link, '_blank')}
                                className="w-full flex items-center justify-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                申込画面を開く
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                          <button
                            onClick={onSuccess}
                            className="btn-primary"
                          >
                            完了
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* SMS送信モーダル */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS送信</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  携帯番号
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="input-field"
                  placeholder="090-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  携帯キャリア
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
                {sendingSms ? '送信中...' : 'SMS送信'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* reCAPTCHA用の非表示div */}
      <div id="recaptcha-container"></div>
    </>
  );
}