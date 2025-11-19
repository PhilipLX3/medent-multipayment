'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { applicationService } from '@/applications/_services';
import { CreateApplicationRequest } from '@/shared/types/application';

export default function NewApplicationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  // Form state matching backend interface
  const [formData, setFormData] = useState<CreateApplicationRequest>({
    customerId: '',
    propertyName: '',
    amount: undefined,
    picName: ''
  });

  // Format amount with commas for display
  const [amountDisplay, setAmountDisplay] = useState('');
  
  // Business type dropdown state
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);

  const formatNumberWithCommas = (value: string): string => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatNumberWithCommas(value);
    setAmountDisplay(formatted);
    
    // Convert to number for API
    const numericValue = value.replace(/[^0-9]/g, '');
    setFormData({ 
      ...formData, 
      amount: numericValue ? parseInt(numericValue, 10) : undefined 
    });

    // Clear amount error when user starts typing
    if (fieldErrors.amount) {
      setFieldErrors({
        ...fieldErrors,
        amount: ''
      });
    }
  };

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showBusinessTypeDropdown && !(event.target as Element)?.closest('#businessTypeButton') && !(event.target as Element)?.closest('[data-dropdown="businessType"]')) {
        setShowBusinessTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBusinessTypeDropdown]);

  const handleInputChange = (field: keyof CreateApplicationRequest, value: string) => {
    setFormData({
      ...formData,
      [field]: value || undefined // Convert empty strings to undefined
    });

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors({
        ...fieldErrors,
        [field]: ''
      });
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    // Validate amount if it has a value
    if (formData.amount !== undefined) {
      if (formData.amount <= 0) {
        errors.amount = '有効な金額を入力してください';
      }
    }

    // Add more field validations here as needed for other fields
    // All fields are optional, so only validate if they have values

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data with businessName field
      const submitData = {
        ...formData,
        businessName: formData.corporateName
      };
      
      const response = await applicationService.create(submitData);
      console.log('Application created:', response.data);
      
      // Store the created application UUID for the next step
      if (response.data?.data) {
        localStorage.setItem('applicationData', JSON.stringify({
          ...formData,
          businessName: formData.corporateName,
          uuid: response.data.data.uuid,
          applicationNumber: response.data.data.applicationNumber
        }));
      }
      
      router.push('/applications/qr');
    } catch (error) {
      console.error('Error creating application:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="card max-w-3xl w-full">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <label htmlFor="customerId" className="text-sm font-medium text-gray-700">
                顧客ID <span className="text-gray-500">(任意)</span>
              </label>
              <input
                type="text"
                id="customerId"
                value={formData.customerId || ''}
                onChange={(e) => handleInputChange('customerId', e.target.value)}
                className="input-field md:col-span-3"
              />
            </div>

            {/* Business Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <label htmlFor="businessType" className="text-sm font-medium text-gray-700">
                事業形態 <span className="text-gray-500">(任意)</span>
              </label>
              <div className="relative md:col-span-3">
                <button
                  id="businessTypeButton"
                  type="button"
                  onClick={() => setShowBusinessTypeDropdown(!showBusinessTypeDropdown)}
                  className="w-full text-left border border-gray-300 rounded-md px-3 py-2 text-gray-700 text-sm inline-flex items-center justify-between bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formData.businessType === 'Corporation' ? '法人' : 
                   formData.businessType === 'Individual' ? '個人事業主' : 
                   '選択してください'}
                  <svg className="w-2.5 h-2.5 ml-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                  </svg>
                </button>

                {showBusinessTypeDropdown && (
                  <div data-dropdown="businessType" className="absolute top-full left-0 z-10 mt-1 bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-full border">
                    <ul className="text-sm text-gray-700 border border-gray-300 rounded-md">
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('businessType', 'Corporation');
                            setShowBusinessTypeDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100"
                        >
                          法人
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('businessType', 'Individual');
                            setShowBusinessTypeDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100"
                        >
                          個人事業主
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <label htmlFor="corporateName" className="text-sm font-medium text-gray-700">
                {formData.businessType === 'Corporation' ? '法人名' : 
                 formData.businessType === 'Individual' ? '代表者名' : 
                 '法人名'} <span className="text-gray-500">(任意)</span>
              </label>
              <input
                type="text"
                id="corporateName"
                value={formData.corporateName || ''}
                onChange={(e) => handleInputChange('corporateName', e.target.value)}
                placeholder={formData.businessType === 'Corporation' ? '医療法人' : 
                            formData.businessType === 'Individual' ? '山田太郎' : 
                            ''}
                className="input-field md:col-span-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <label htmlFor="clinicName" className="text-sm font-medium text-gray-700">
                医院名 <span className="text-gray-500">(任意)</span>
              </label>
              <input
                type="text"
                id="clinicName"
                value={formData.clinicName || ''}
                onChange={(e) => handleInputChange('clinicName', e.target.value)}
                className="input-field md:col-span-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <label htmlFor="propertyName" className="text-sm font-medium text-gray-700">
                物件名 <span className="text-gray-500">(任意)</span>
              </label>
              <input
                type="text"
                id="propertyName"
                value={formData.propertyName || ''}
                onChange={(e) => handleInputChange('propertyName', e.target.value)}
                className="input-field md:col-span-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <label htmlFor="amount" className="text-sm font-medium text-gray-700">
                金額 <span className="text-gray-500">(任意)</span>
              </label>
              <div className="flex items-center md:col-span-3">
                <div className="flex-1">
                  <input
                    type="text"
                    id="amount"
                    value={amountDisplay}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className={`input-field w-full ${
                      fieldErrors.amount ? 'border-red-500' : ''
                    }`}
                    placeholder="5,000,000"
                  />
                  {fieldErrors.amount && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.amount}</p>
                  )}
                </div>
                <span className="ml-2 text-gray-500 text-sm whitespace-nowrap">
                  円(税抜)
                </span>
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <label htmlFor="picName" className="text-sm font-medium text-gray-700">
                担当者名 <span className="text-gray-500">(任意)</span>
              </label>
              <input
                type="text"
                id="picName"
                value={formData.picName || ''}
                onChange={(e) => handleInputChange('picName', e.target.value)}
                className="input-field md:col-span-3"
              />
            </div>
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-10 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '作成中...' : '次へ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
