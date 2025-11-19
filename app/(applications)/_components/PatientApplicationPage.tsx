'use client';
import { useState, useEffect } from 'react';

import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import api from '@/shared/services/api';

interface ApplicationForm {
  // Step 1 - 基本情報
  patient_id?: string;
  name: string;
  name_kana: string;
  birth_date: string;
  gender: 'male' | 'female';
  postal_code: string;
  address: string;
  phone: string;
  mobile: string;
  email: string;

  // Step 2 - 家族情報
  marital_status: 'single' | 'married';
  dependents: number;
  family_members: string;

  // Step 3 - 勤務先情報
  company_name: string;
  company_address: string;
  company_phone: string;
  establishment_date: string;
  employees: number;
  industry: string;
  position: string;
  annual_income: number;
  payment_day: number;

  // Step 4 - 緊急連絡先
  emergency_name: string;
  emergency_relationship: string;
  emergency_phone: string;

  // Step 5 - 支払いプラン
  installments: number;
}

const steps = [
  { id: 1, name: '基本情報' },
  { id: 2, name: '家族情報' },
  { id: 3, name: '勤務先情報' },
  { id: 4, name: '緊急連絡先' },
  { id: 5, name: '支払いプラン' },
  { id: 6, name: '本人確認書類' },
];

export default function PatientApplicationPage() {
  const router = useRouter();
  const params = useParams<{ linkId: string }>();
  const linkId = params?.linkId || '';
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
  } = useForm<ApplicationForm>();

  useEffect(() => {
    // 医院側で入力された情報を取得
    const fetchPaymentInfo = async () => {
      try {
        const response = await api.get(`/public/payments/link/${linkId}`);
        const data = response.data;
        setPaymentInfo(data);
        
        // 医院側で入力された情報を自動セット
        if (data.patient_id) {
          setValue('patient_id', data.patient_id);
        }
        if (data.patient_name) {
          setValue('name', data.patient_name);
        }
      } catch (error) {
        console.error('Payment information fetch error:', error);
      }
    };

    if (linkId) {
      fetchPaymentInfo();
    }
  }, [linkId, setValue]);

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    return await trigger(fieldsToValidate);
  };

  const getFieldsForStep = (step: number): (keyof ApplicationForm)[] => {
    switch (step) {
      case 1:
        return ['name', 'name_kana', 'birth_date', 'gender', 'postal_code', 'address', 'mobile', 'email'];
      case 2:
        return ['marital_status', 'dependents', 'family_members'];
      case 3:
        return ['company_name', 'company_address', 'company_phone', 'establishment_date', 'employees', 'industry', 'position', 'annual_income', 'payment_day'];
      case 4:
        return ['emergency_name', 'emergency_relationship', 'emergency_phone'];
      case 5:
        return ['installments'];
      default:
        return [];
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const onSubmit = async (data: ApplicationForm) => {
    if (!uploadedFile) {
      alert('本人確認書類をアップロードしてください');
      return;
    }

    setIsSubmitting(true);
    // TODO: Submit application
    console.log('Application data:', data);
    console.log('Uploaded file:', uploadedFile);
    
    setTimeout(() => {
      router.push('/apply/complete?id=APP-' + Date.now());
      setIsSubmitting(false);
    }, 2000);
  };

  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">ローンお申込み</h1>
            <p className="mt-1 text-sm text-gray-500">
              {paymentInfo?.clinic_name || 'MedEnt歯科医院'} - 治療費ローン申込
            </p>
            {paymentInfo && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="text-sm">
                  {paymentInfo.treatment_name && (
                    <p className="text-gray-700">
                      <span className="font-medium">治療名:</span> {paymentInfo.treatment_name}
                    </p>
                  )}
                  {paymentInfo.amount && (
                    <p className="text-gray-700 mt-1">
                      <span className="font-medium">金額:</span> ¥{paymentInfo.amount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="px-6 py-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-center mt-2 text-sm font-medium text-gray-700">
              ステップ {currentStep} / {steps.length}: {steps[currentStep - 1].name}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">
            {/* Step 1: 基本情報 */}
            <div className={currentStep === 1 ? 'block' : 'hidden'}>
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">お客様ご自身の情報</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    患者ID（任意）
                  </label>
                  <input
                    {...register('patient_id')}
                    type="text"
                    className="input-field"
                    placeholder="00123"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      氏名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('name', { required: '氏名を入力してください' })}
                      type="text"
                      className="input-field"
                      placeholder="山田 太郎"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      氏名（カナ） <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('name_kana', { required: '氏名（カナ）を入力してください' })}
                      type="text"
                      className="input-field"
                      placeholder="ヤマダ タロウ"
                    />
                    {errors.name_kana && (
                      <p className="mt-1 text-sm text-red-600">{errors.name_kana.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      生年月日 <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('birth_date', { required: '生年月日を選択してください' })}
                      type="date"
                      className="input-field"
                    />
                    {errors.birth_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.birth_date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      性別 <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('gender', { required: '性別を選択してください' })}
                      className="input-field"
                    >
                      <option value="">選択してください</option>
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    郵便番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('postal_code', { 
                      required: '郵便番号を入力してください',
                      pattern: {
                        value: /^\d{3}-?\d{4}$/,
                        message: '正しい郵便番号を入力してください'
                      }
                    })}
                    type="text"
                    className="input-field"
                    placeholder="123-4567"
                  />
                  {errors.postal_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.postal_code.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    住所 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('address', { required: '住所を入力してください' })}
                    type="text"
                    className="input-field"
                    placeholder="東京都渋谷区..."
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      電話番号
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="input-field"
                      placeholder="03-1234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      携帯電話番号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('mobile', { required: '携帯電話番号を入力してください' })}
                      type="tel"
                      className="input-field"
                      placeholder="090-1234-5678"
                    />
                    {errors.mobile && (
                      <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('email', {
                      required: 'メールアドレスを入力してください',
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: '有効なメールアドレスを入力してください'
                      }
                    })}
                    type="email"
                    className="input-field"
                    placeholder="yamada@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: 家族情報 */}
            <div className={currentStep === 2 ? 'block' : 'hidden'}>
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">ご家族・住居について</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    配偶者 <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('marital_status', { required: '選択してください' })}
                    className="input-field"
                  >
                    <option value="">選択してください</option>
                    <option value="single">未婚</option>
                    <option value="married">既婚</option>
                  </select>
                  {errors.marital_status && (
                    <p className="mt-1 text-sm text-red-600">{errors.marital_status.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    扶養家族人数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('dependents', {
                      required: '扶養家族人数を入力してください',
                      min: { value: 0, message: '0以上の数値を入力してください' }
                    })}
                    type="number"
                    className="input-field"
                    placeholder="0"
                  />
                  {errors.dependents && (
                    <p className="mt-1 text-sm text-red-600">{errors.dependents.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    家族構成 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('family_members', { required: '家族構成を入力してください' })}
                    type="text"
                    className="input-field"
                    placeholder="例: 妻、子供2人"
                  />
                  {errors.family_members && (
                    <p className="mt-1 text-sm text-red-600">{errors.family_members.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: 勤務先情報 */}
            <div className={currentStep === 3 ? 'block' : 'hidden'}>
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">お勤め先について</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    会社名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('company_name', { required: '会社名を入力してください' })}
                    type="text"
                    className="input-field"
                    placeholder="株式会社サンプル"
                  />
                  {errors.company_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    会社住所 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('company_address', { required: '会社住所を入力してください' })}
                    type="text"
                    className="input-field"
                    placeholder="東京都千代田区..."
                  />
                  {errors.company_address && (
                    <p className="mt-1 text-sm text-red-600">{errors.company_address.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    会社電話番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('company_phone', { required: '会社電話番号を入力してください' })}
                    type="tel"
                    className="input-field"
                    placeholder="03-xxxx-xxxx"
                  />
                  {errors.company_phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.company_phone.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      設立年月日 <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('establishment_date', { required: '設立年月日を選択してください' })}
                      type="date"
                      className="input-field"
                    />
                    {errors.establishment_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.establishment_date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      従業員数 <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('employees', {
                        required: '従業員数を入力してください',
                        min: { value: 1, message: '1以上の数値を入力してください' }
                      })}
                      type="number"
                      className="input-field"
                      placeholder="50"
                    />
                    {errors.employees && (
                      <p className="mt-1 text-sm text-red-600">{errors.employees.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    業種 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('industry', { required: '業種を入力してください' })}
                    type="text"
                    className="input-field"
                    placeholder="医療・福祉"
                  />
                  {errors.industry && (
                    <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    役職 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('position', { required: '役職を入力してください' })}
                    type="text"
                    className="input-field"
                    placeholder="部長"
                  />
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      年収（万円） <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('annual_income', {
                        required: '年収を入力してください',
                        min: { value: 1, message: '1以上の数値を入力してください' }
                      })}
                      type="number"
                      className="input-field"
                      placeholder="600"
                    />
                    {errors.annual_income && (
                      <p className="mt-1 text-sm text-red-600">{errors.annual_income.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      給与支払日（毎月） <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('payment_day', {
                        required: '給与支払日を入力してください',
                        min: { value: 1, message: '1〜31の数値を入力してください' },
                        max: { value: 31, message: '1〜31の数値を入力してください' }
                      })}
                      type="number"
                      className="input-field"
                      placeholder="25"
                    />
                    {errors.payment_day && (
                      <p className="mt-1 text-sm text-red-600">{errors.payment_day.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: 緊急連絡先 */}
            <div className={currentStep === 4 ? 'block' : 'hidden'}>
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">身内の方の連絡先</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    氏名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('emergency_name', { required: '氏名を入力してください' })}
                    type="text"
                    className="input-field"
                    placeholder="山田 花子"
                  />
                  {errors.emergency_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergency_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    続柄 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('emergency_relationship', { required: '続柄を入力してください' })}
                    type="text"
                    className="input-field"
                    placeholder="妻"
                  />
                  {errors.emergency_relationship && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergency_relationship.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    電話番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('emergency_phone', { required: '電話番号を入力してください' })}
                    type="tel"
                    className="input-field"
                    placeholder="090-xxxx-xxxx"
                  />
                  {errors.emergency_phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergency_phone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 5: 支払いプラン */}
            <div className={currentStep === 5 ? 'block' : 'hidden'}>
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">お支払いプラン選択</h2>
              <div className="space-y-4">
                {/* 金額入力 - 常に表示 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    お支払い金額 <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">¥</span>
                    </div>
                    <input
                      type="number"
                      className="input-field pl-8"
                      placeholder="500000"
                      min="1000"
                      max="10000000"
                      step="1000"
                      value={paymentInfo?.amount || ''}
                      onChange={(e) => {
                        const amount = parseInt(e.target.value) || 0;
                        setPaymentInfo({...paymentInfo, amount});
                      }}
                      required
                    />
                  </div>
                </div>
                
                {/* 支払いプラン表 */}
                {paymentInfo?.payment_plans && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      お支払いプランをお選びください <span className="text-red-500">*</span>
                    </label>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              選択
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              分割回数
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              月々のお支払い
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              総支払額
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              手数料率
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {/* 一括払いオプション（グレーアウト） */}
                          <tr className="bg-gray-50 opacity-50">
                            <td className="px-4 py-3">
                              <input
                                type="radio"
                                value="1"
                                disabled
                                className="text-gray-400 cursor-not-allowed"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">一括払い（準備中）</td>
                            <td className="px-4 py-3 text-sm text-gray-400">-</td>
                            <td className="px-4 py-3 text-sm text-gray-400">-</td>
                            <td className="px-4 py-3 text-sm text-gray-400">-</td>
                          </tr>
                          
                          {/* 分割払いオプション */}
                          {paymentInfo.payment_plans.map((plan: any) => (
                            <tr key={plan.months} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <input
                                  {...register('installments', { required: '分割回数を選択してください' })}
                                  type="radio"
                                  value={plan.months}
                                  className="text-primary-600 focus:ring-primary-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {plan.months}回
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                ¥{plan.monthly_payment.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                ¥{plan.total_payment.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {plan.interest_rate}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* 既存のラジオボタン（payment_plansがない場合） */}
                {!paymentInfo?.payment_plans && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      分割回数を選択してください <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {/* 一括払いオプション（グレーアウト） */}
                      <label className="flex items-center opacity-50">
                        <input
                          type="radio"
                          value="1"
                          disabled
                          className="mr-2 cursor-not-allowed"
                        />
                        <span className="text-gray-400">一括払い（準備中）</span>
                      </label>
                      
                      {/* 分割払いオプション */}
                      {[2, 3, 4, 5, 6, 7].map((num) => (
                        <label key={num} className="flex items-center">
                          <input
                            {...register('installments', { required: '分割回数を選択してください' })}
                            type="radio"
                            value={num}
                            className="mr-3 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm">{num}回払い</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {errors.installments && (
                  <p className="mt-1 text-sm text-red-600">{errors.installments.message}</p>
                )}
              </div>
            </div>

            {/* Step 6: 本人確認書類 */}
            <div className={currentStep === 6 ? 'block' : 'hidden'}>
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">ご本人様確認書類の提出</h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  最後に、ご本人様確認書類の写真をアップロードしてください。
                  <br />
                  （運転免許証、パスポート、マイナンバーカードなど）
                </p>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>ファイルをアップロード</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/png,application/pdf"
                          onChange={handleFileUpload}
                        />
                      </label>
                      <p className="pl-1">またはドラッグ＆ドロップ</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  </div>
                </div>
                {uploadedFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    アップロード済み: {uploadedFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={clsx(
                  'inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md',
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                <ChevronLeftIcon className="mr-2 h-5 w-5" />
                戻る
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  次へ
                  <ChevronRightIcon className="ml-2 h-5 w-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !uploadedFile}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '送信中...' : '申込みを完了する'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}