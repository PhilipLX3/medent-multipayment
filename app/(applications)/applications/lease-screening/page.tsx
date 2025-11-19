'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, DocumentIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { applicationService } from '@/applications/_services';
import { CreateApplicationRequest } from '@/applications/_types';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ja } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Spinner } from '@/shared/components/Spinner';
import React from 'react';
import SignatureCanvas from 'react-signature-canvas';

// Custom spinner styles
const spinnerStyles = `
  .loader {
    width: 16px;
    height: 16px;
    border: 2px solid #e5e7eb;
    border-bottom-color: #3b82f6;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

// Register Japanese locale for DatePicker
registerLocale('ja', ja);

export default function LeaseScreeningPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [signatureCanvas, setSignatureCanvas] = useState<SignatureCanvas | null>(null);
  const [signatureData, setSignatureData] = useState<string>('');
  const [hasSignature, setHasSignature] = useState(false);
  const [isSignatureCanvasReady, setIsSignatureCanvasReady] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 200 });

  const setSignatureRef = useCallback((ref: SignatureCanvas | null) => {
    console.log('[Canvas] setSignatureRef called, ref exists:', !!ref);
    setSignatureCanvas(ref);
    if (ref) {
      console.log('[Canvas] Signature canvas is ready');
      setIsSignatureCanvasReady(true);
    } else {
      console.log('[Canvas] Signature canvas ref is null');
      setIsSignatureCanvasReady(false);
    }
  }, []); // Remove all dependencies to prevent re-creation

  // Utility functions for date conversion
  const convertDateToIso = (date: Date | null): string => {
    if (!date) return '';
    // Use local date to avoid timezone offset issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatJapaneseAddress = (postalCode: string, address: string): string => {
    if (!address.trim()) return '';

    // If postal code is provided and is 7 digits, format it as 〒XXX-XXXX
    if (postalCode && postalCode.length === 7) {
      const formattedPostalCode = `〒${postalCode.slice(0, 3)}-${postalCode.slice(3)}`;
      return `${formattedPostalCode} ${address.trim()}`;
    }

    return address.trim();
  };

  const formatDateJapanese = (date: Date | null): string => {
    if (!date || isNaN(date.getTime())) return '';

    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // Validate that we got valid numbers
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return '';
      }

      const monthStr = String(month).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');

      return `${year}/${monthStr}/${dayStr}`;
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return '';
    }
  };
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    businessType: '',
    companyName: '',
    hospitalName: '',
    hospitalAddress: '',
    hospitalPostalCode: '',
    hospitalTel: '',
    representativeLastName: '',
    representativeFirstName: '',
    representativeLastNameFurigana: '',
    representativeFirstNameFurigana: '',
    representativeAddress: '',
    representativePostalCode: '',
    representativeTel: '',
    propertyName: '',
    amount: '',
    privacyAgreement: false
  });
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [birthDateInput, setBirthDateInput] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);

  // Postal code loading and error states
  const [hospitalPostalLoading, setHospitalPostalLoading] = useState(false);
  const [representativePostalLoading, setRepresentativePostalLoading] = useState(false);
  const [hospitalAddressError, setHospitalAddressError] = useState<string>('');
  const [representativeAddressError, setRepresentativeAddressError] = useState<string>('');

  useEffect(() => {
    const storedData = localStorage.getItem('applicationData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setFormData(prevData => ({
          ...prevData,
          businessType: parsedData.businessType || 'Corporation',
          companyName: parsedData.corporateName || parsedData.companyName || '',
          hospitalName: parsedData.clinicName || parsedData.hospitalName || '',
          propertyName: parsedData.propertyName || '',
          amount: parsedData.amount ? formatNumberWithCommas(String(parsedData.amount)) : '',
        }));
      } catch (err) {
        console.error('parse error', err);
      }
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const currentMobile = isMobile;
      const newIsMobile = window.innerWidth < 768;
      
      // Only proceed if mobile state actually changed
      if (currentMobile !== newIsMobile) {
        console.log('[Canvas] Mobile state changed:', currentMobile, '->', newIsMobile);
        setIsMobile(newIsMobile);
        
        // Calculate stable canvas size
        const newWidth = newIsMobile ? Math.min(window.innerWidth - 64, 500) : 600;
        const newHeight = newIsMobile ? 160 : 192;
        
        // Only update canvas size if dimensions actually changed
        if (canvasSize.width !== newWidth || canvasSize.height !== newHeight) {
          console.log('[Canvas] Size changing:', canvasSize, '->', { width: newWidth, height: newHeight });
          
          // Save current signature before resize if canvas exists
          if (signatureCanvas && hasSignature) {
            try {
              const currentSignature = signatureCanvas.toDataURL();
              setSignatureData(currentSignature);
              console.log('[Canvas] Saved signature before resize');
            } catch (error) {
              console.error('Error saving signature before resize:', error);
            }
          }
          
          setCanvasSize({ width: newWidth, height: newHeight });
        }
      }
    };

    // Initial check
    checkMobile();
    
    // Debounced resize handler with longer delay to prevent excessive calls
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        console.log('[Canvas] Resize event triggered');
        checkMobile();
      }, 500); // Increased delay to 500ms
    };
    
    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []); // Remove all dependencies to prevent circular updates

  // Effect to restore signature when canvas becomes ready or when signature data changes
  useEffect(() => {
    if (signatureCanvas && signatureData && isSignatureCanvasReady && !hasSignature) {
      console.log('[Canvas] Restoring signature - canvas ready and has data');
      try {
        // Small delay to ensure canvas is fully rendered
        setTimeout(() => {
          try {
            if (signatureCanvas && signatureData) { // Double-check canvas still exists
              signatureCanvas.clear();
              signatureCanvas.fromDataURL(signatureData);
              setHasSignature(true);
              console.log('[Canvas] Signature restored successfully');
            }
          } catch (error) {
            console.error('Error restoring signature from data URL:', error);
          }
        }, 100);
      } catch (error) {
        console.error('Error setting up signature restoration:', error);
      }
    }
  }, [signatureCanvas, signatureData, isSignatureCanvasReady, hasSignature]);

  // Effect to restore signature after canvas size change
  useEffect(() => {
    if (signatureCanvas && signatureData && isSignatureCanvasReady && hasSignature) {
      console.log('[Canvas] Restoring signature after canvas size change');
      try {
        // Longer delay to ensure canvas is fully ready after size change
        setTimeout(() => {
          try {
            if (signatureCanvas && signatureData) { // Double-check canvas still exists
              signatureCanvas.clear();
              signatureCanvas.fromDataURL(signatureData);
              console.log('[Canvas] Signature restored after resize');
            }
          } catch (error) {
            console.error('Error restoring signature after resize:', error);
            // Reset signature state if restoration fails
            setSignatureData('');
            setHasSignature(false);
          }
        }, 150); // Longer delay for size changes
      } catch (error) {
        console.error('Error restoring signature after resize:', error);
        setSignatureData('');
        setHasSignature(false);
      }
    }
  }, [canvasSize.width, canvasSize.height]); // Only depend on size dimensions

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDatePicker && !(event.target as Element)?.closest('.react-datepicker')) {
        setShowDatePicker(false);
      }
      if (showBusinessTypeDropdown && !(event.target as Element)?.closest('#businessTypeButton') && !(event.target as Element)?.closest('[data-dropdown="businessType"]')) {
        setShowBusinessTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker, showBusinessTypeDropdown]);

  // Convert kanji to furigana using Kuromoji (client-side only)
  const convertToFurigana = async (text: string): Promise<string> => {
    // If text is already hiragana/katakana, return as is
    if (/^[\u3040-\u309F\u30A0-\u30FF\s]*$/.test(text)) {
      return text;
    }

    // If no kanji characters, return empty
    if (!/[\u4E00-\u9FAF]/.test(text)) {
      return '';
    }

    // Only try Kuromoji in browser environment
    if (typeof window !== 'undefined') {
      try {
        const furiganaService = await import('../../../../src/shared/services/furiganaService');
        const result = await furiganaService.convertKanjiToFurigana(text);
        if (result) {
          return result;
        }
      } catch (error) {
        console.log('Kuromoji furigana conversion failed:', error);
      }
    }
      
    // Fallback to basic kanji mapping
    const basicMap: { [key: string]: string } = {
      '田': 'た', '中': 'なか', '山': 'やま', '佐': 'さ', '藤': 'とう',
      '木': 'き', '井': 'い', '川': 'かわ', '高': 'たか', '小': 'こ',
      '松': 'まつ', '太': 'た', '郎': 'ろう', '子': 'こ', '美': 'み',
      '花': 'か', '雄': 'お', '男': 'お', '一': 'いち', '二': 'に', '三': 'さん',
      '石': 'いし', '林': 'はやし', '森': 'もり', '池': 'いけ', '村': 'むら',
      '島': 'しま', '橋': 'はし', '本': 'もと', '原': 'はら', '野': 'の',
      '宮': 'みや', '内': 'うち', '上': 'うえ', '下': 'した', '西': 'にし',
      '東': 'ひがし', '南': 'みなみ', '北': 'きた', '大': 'おお', '和': 'わ',
      '正': 'まさ', '明': 'あき', '昭': 'あき', '平': 'へい', '成': 'なり',
      '博': 'ひろ', '弘': 'ひろ', '浩': 'ひろ', '宏': 'ひろ', '裕': 'ゆう',
      '智': 'とも', '彦': 'ひこ', '夫': 'お', '雅': 'まさ', '健': 'けん',
      '伸': 'のぶ', '誠': 'まこと', '実': 'みのる', '清': 'きよし', '武': 'たけし'
    };
    
    const result = text.split('').map(char => basicMap[char] || '').join('');
    
    // If we got a complete conversion, return it, otherwise return empty for manual input
    const hasUnknownChars = text.split('').some(char => 
      /[\u4E00-\u9FAF]/.test(char) && !basicMap[char]
    );
    
    return hasUnknownChars ? '' : result;
  };

  const handleInputChange = async (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });

    // Auto-generate furigana for representative names
    if (field === 'representativeLastName' && value.trim()) {
      const furigana = await convertToFurigana(value);
      setFormData(prev => ({
        ...prev,
        representativeLastName: value,
        representativeLastNameFurigana: furigana
      }));
    } else if (field === 'representativeFirstName' && value.trim()) {
      const furigana = await convertToFurigana(value);
      setFormData(prev => ({
        ...prev,
        representativeFirstName: value,
        representativeFirstNameFurigana: furigana
      }));
    }

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors({
        ...fieldErrors,
        [field]: ''
      });
    }

    // Clear postal code lookup errors when manually typing in address fields
    if (field === 'hospitalAddress' && hospitalAddressError) {
      setHospitalAddressError('');
    }
    if (field === 'representativeAddress' && representativeAddressError) {
      setRepresentativeAddressError('');
    }
  };

  const formatNumberWithCommas = (value: string): string => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatNumberWithCommas(value);
    setFormData({ ...formData, amount: formatted });
    // Clear amount error when user starts typing
    if (fieldErrors.amount) {
      setFieldErrors({
        ...fieldErrors,
        amount: ''
      });
    }
  };

  const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>, postalCodeField: string, addressField: string) => {
    const value = e.target.value.replace(/[^\d]/g, '');

    // Immediately update the postal code field to preserve the input
    setFormData(prevData => ({
      ...prevData,
      [postalCodeField]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[postalCodeField]) {
      setFieldErrors(prevErrors => ({
        ...prevErrors,
        [postalCodeField]: ''
      }));
    }

    // Clear previous errors when typing
    if (postalCodeField === 'hospitalPostalCode') {
      setHospitalAddressError('');
    } else {
      setRepresentativeAddressError('');
    }

    // Auto-lookup address when postal code is exactly 7 digits
    if (value.length === 7) {
      // Set loading state
      if (postalCodeField === 'hospitalPostalCode') {
        setHospitalPostalLoading(true);
        setHospitalAddressError('');
      } else {
        setRepresentativePostalLoading(true);
        setRepresentativeAddressError('');
      }

      try {
        const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${value}`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const address = `${result.address1}${result.address2}${result.address3}`;
          setFormData(prevData => ({
            ...prevData,
            [addressField]: address
          }));
        } else {
          // No results found
          const errorMsg = '住所が見つかりません';
          if (postalCodeField === 'hospitalPostalCode') {
            setHospitalAddressError(errorMsg);
          } else {
            setRepresentativeAddressError(errorMsg);
          }
        }
      } catch (error) {
        console.error('Address lookup failed:', error);
        const errorMsg = '住所の取得に失敗しました';
        if (postalCodeField === 'hospitalPostalCode') {
          setHospitalAddressError(errorMsg);
        } else {
          setRepresentativeAddressError(errorMsg);
        }
      } finally {
        // Clear loading state
        if (postalCodeField === 'hospitalPostalCode') {
          setHospitalPostalLoading(false);
        } else {
          setRepresentativePostalLoading(false);
        }
      }
    }
  };

  const handleClearSignature = () => {
    if (signatureCanvas) {
      signatureCanvas.clear();
      setSignatureData('');
      setHasSignature(false);
      if (fieldErrors.signature) {
        setFieldErrors(prev => ({ ...prev, signature: '' }));
      }
    }
  };

  const handleSignatureBegin = () => {
    console.log('[Canvas] Signature drawing started - canvas:', !!signatureCanvas, 'size:', canvasSize);
    // Clear signature error when user starts drawing
    if (fieldErrors.signature) {
      setFieldErrors(prev => ({ ...prev, signature: '' }));
    }
  };

  const handleSignatureEnd = () => {
    console.log('[Canvas] Signature drawing ended - canvas:', !!signatureCanvas, 'size:', canvasSize);
    if (signatureCanvas) {
      try {
        const isEmpty = signatureCanvas.isEmpty();
        console.log('[Canvas] Signature isEmpty:', isEmpty);
        if (!isEmpty) {
          const dataUrl = signatureCanvas.toDataURL();
          console.log('[Canvas] Signature captured, data URL length:', dataUrl.length);
          setSignatureData(dataUrl);
          setHasSignature(true);
          if (fieldErrors.signature) {
            setFieldErrors(prev => ({ ...prev, signature: '' }));
          }
        } else {
          setSignatureData('');
          setHasSignature(false);
        }
      } catch (error) {
        console.error('Error handling signature end:', error);
      }
    } else {
      console.log('[Canvas] WARNING: signatureCanvas is null in handleSignatureEnd');
    }
  };

  // Convert signature data URL to File object for upload
  const signatureToFile = (dataUrl: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], 'signature.png', { type: mime });
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Required field validation
    if (!formData.businessType.trim()) {
      errors.businessType = '事業形態は必須です';
    }

    if (!formData.companyName.trim()) {
      errors.companyName = '法人名は必須です';
    }

    if (!formData.hospitalName.trim()) {
      errors.hospitalName = '医院名は必須です';
    }

    if (!formData.hospitalAddress.trim()) {
      errors.hospitalAddress = '医院住所は必須です';
    }

    if (!formData.hospitalTel.trim()) {
      errors.hospitalTel = '医院TELは必須です';
    } else {
      const cleanTel = formData.hospitalTel.replace(/[-+().\s]/g, '');
      if (!/^\d+$/.test(cleanTel) || cleanTel.length < 10 || cleanTel.length > 15) {
        errors.hospitalTel = '有効な電話番号を入力してください（10-15桁の数字）';
      }
    }

    if (!formData.representativeLastName.trim()) {
      errors.representativeLastName = '代表者名（姓）は必須です';
    }

    if (!formData.representativeFirstName.trim()) {
      errors.representativeFirstName = '代表者名（名）は必須です';
    }

    // Validate furigana fields when representative names are provided
    if (formData.representativeLastName.trim() && !formData.representativeLastNameFurigana.trim()) {
      errors.representativeLastNameFurigana = '代表者名（姓）のふりがなを入力してください';
    }

    if (formData.representativeFirstName.trim() && !formData.representativeFirstNameFurigana.trim()) {
      errors.representativeFirstNameFurigana = '代表者名（名）のふりがなを入力してください';
    }

    if (!birthDate) {
      errors.birthDate = '生年月日は必須です';
    }

    if (!formData.representativeAddress.trim()) {
      errors.representativeAddress = '代表者住所は必須です';
    }

    if (!formData.representativeTel.trim()) {
      errors.representativeTel = '代表者TELは必須です';
    } else {
      const cleanTel = formData.representativeTel.replace(/[-+().\s]/g, '');
      if (!/^\d+$/.test(cleanTel) || cleanTel.length < 10 || cleanTel.length > 15) {
        errors.representativeTel = '有効な電話番号を入力してください（10-15桁の数字）';
      }
    }

    if (!formData.propertyName.trim()) {
      errors.propertyName = '物件名は必須です';
    }

    if (!formData.amount || !String(formData.amount).trim()) {
      errors.amount = '金額は必須です';
    } else {
      const numericAmount = String(formData.amount).replace(/[^0-9]/g, '');
      if (!numericAmount || parseInt(numericAmount) <= 0) {
        errors.amount = '有効な金額を入力してください';
      }
    }

    // Validate signature
    console.log('[TokenRefresh] Validating signature...');
    console.log('[TokenRefresh] hasSignature:', hasSignature);
    console.log('[TokenRefresh] signatureData length:', signatureData?.length || 0);

    // Check if we have signature data
    if (!hasSignature || !signatureData || signatureData.length === 0) {
      // Try to get it from the canvas state as a fallback
      if (signatureCanvas) {
        try {
          const isEmpty = signatureCanvas.isEmpty();
          console.log('[TokenRefresh] Canvas available - isEmpty:', isEmpty);

          if (!isEmpty) {
            const dataUrl = signatureCanvas.toDataURL();
            console.log('[TokenRefresh] Signature captured from canvas, length:', dataUrl.length);
            if (dataUrl && dataUrl.length > 0) {
              console.log('[TokenRefresh] Signature is valid from canvas');
            } else {
              errors.signature = '電子サインは必須です';
            }
          } else {
            errors.signature = '電子サインは必須です';
          }
        } catch (error) {
          console.error('Error checking signature ref:', error);
          errors.signature = '電子サインは必須です';
        }
      } else {
        console.log('[TokenRefresh] No signature data and canvas not available');
        errors.signature = '電子サインは必須です';
      }
    } else {
      console.log('[TokenRefresh] Signature validation passed - using existing signature data');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitWithConsent = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowUploadModal(true);
  };

  const handleSubmit = async (submissionType: 'withConsent' | 'direct') => {
    // Validate all fields
    if (!validateForm()) {
      //console.log('Validation failed. Errors:', fieldErrors);
      //console.log('Has signature:', hasSignature);
      //console.log('Signature data length:', signatureData?.length || 0);
      toast.error('入力エラーがあります。各項目を確認してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user is authenticated
      const isAuthenticated = localStorage.getItem('auth-storage') ? 
        JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.isAuthenticated : false;

      if (!isAuthenticated) {
        // Fake API success for non-authenticated users
        console.log('User not authenticated, faking API success...');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store fake success data for completion page
        const fakeApplicationId = `fake-${Date.now()}`;
        const allData = {
          ...formData,
          hospitalAddress: formatJapaneseAddress(formData.hospitalPostalCode, formData.hospitalAddress),
          representativeAddress: formatJapaneseAddress(formData.representativePostalCode, formData.representativeAddress),
          birthDate: convertDateToIso(birthDate),
          submissionType,
          applicationId: fakeApplicationId,
          representativeName: `${formData.representativeLastName} ${formData.representativeFirstName}`.trim(),
          representativeNameFurigana: `${formData.representativeLastNameFurigana} ${formData.representativeFirstNameFurigana}`.trim(),
          uploadedFiles: uploadedFiles.map(f => ({ name: f.name, size: f.size })),
          hasAttachments: uploadedFiles.length > 0,
          signature: signatureData,
          isFakeSubmission: true // Flag to indicate this is a fake submission
        };

        localStorage.setItem('applicationData', JSON.stringify(allData));

        toast.success(`申請を提出しました${uploadedFiles.length > 0 ? ` (添付ファイル: ${uploadedFiles.length}件)` : ''}`);
        router.push('/applications/complete');
        return;
      }

      // Authenticated user flow - use real API
      // Get the existing application data from localStorage (from QR page)
      const storedData = localStorage.getItem('applicationData');
      let applicationUuid: string | null = null;

      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          applicationUuid = parsedData.uuid || parsedData.applicationId;
        } catch (parseError) {
          console.error('Error parsing stored application data:', parseError);
        }
      }

      if (!applicationUuid) {
        throw new Error('申請情報が見つかりません。最初からやり直してください。');
      }

      console.log('Using application UUID:', applicationUuid);

      // Prepare application data for updating
      const applicationData: CreateApplicationRequest = {
        businessType: formData.businessType,
        businessName: formData.companyName,
        corporateName: formData.companyName,
        clinicName: formData.hospitalName,
        clinicAddress: formatJapaneseAddress(formData.hospitalPostalCode, formData.hospitalAddress),
        clinicTel: formData.hospitalTel || '',
        representativeLastName: formData.representativeLastName,
        representativeFirstName: formData.representativeFirstName,
        representativeLastNameFurigana: formData.representativeLastNameFurigana,
        representativeFirstNameFurigana: formData.representativeFirstNameFurigana,
        representativeAddress: formatJapaneseAddress(formData.representativePostalCode, formData.representativeAddress),
        representativeTel: formData.representativeTel || '',
        representativeBirthDate: convertDateToIso(birthDate),
        propertyName: formData.propertyName,
        amount: parseInt(String(formData.amount).replace(/[^0-9]/g, '')),
        picName: `${formData.representativeLastName} ${formData.representativeFirstName}`.trim(),
      };

      // Update the existing application with detailed information
      console.log('Updating existing application with detailed info...');
      await applicationService.update(applicationUuid, applicationData);

      // Upload attachments if any files were uploaded
      const filesToUpload = uploadedFiles.map(uf => uf.file);

      // Add signature as an attachment
      if (signatureData) {
        try {
          const signatureFile = signatureToFile(signatureData);
          filesToUpload.push(signatureFile);
        } catch (error) {
          console.error('Error converting signature to file:', error);
        }
      }

      if (filesToUpload.length > 0) {
        console.log(`Uploading ${filesToUpload.length} attachments (including signature)...`);
        try {
          await applicationService.uploadAttachments(applicationUuid, filesToUpload);
          console.log('Attachments uploaded successfully');
        } catch (attachmentError: any) {
          console.error('Attachment upload error:', attachmentError);
          toast.error('添付ファイルのアップロードに失敗しました');
          throw attachmentError;
        }
      }

      // Submit the application for screening
      // Note: Backend expects application to be in READY_TO_SUBMIT status
      console.log('Submitting application for screening...');
      try {
        const submitResponse = await applicationService.submitForScreening(applicationUuid);
        console.log('Application submitted successfully:', submitResponse);
      } catch (submitError: any) {
        console.error('Submit error:', submitError);
        // Check if error is due to status not being ready
        if (submitError.response?.status === 400 &&
          submitError.response?.data?.message?.includes('Ready to Submit')) {

          console.log('Application not ready, trying to mark as ready...');
          try {
            // Try to mark application as ready to submit
            await applicationService.markAsReadyToSubmit(applicationUuid);
            console.log('Application marked as ready');
          } catch (readyError) {
            console.log('Ready endpoint failed, trying update...');
            // If that endpoint doesn't exist, try updating with all fields
            await applicationService.update(applicationUuid, applicationData);
            console.log('Application updated');
          }

          // Retry submission
          console.log('Retrying submission...');
          const retryResponse = await applicationService.submitForScreening(applicationUuid);
          console.log('Application submitted on retry:', retryResponse);
        } else {
          throw submitError;
        }
      }

      // Store success data for completion page
      const allData = {
        ...formData,
        hospitalAddress: formatJapaneseAddress(formData.hospitalPostalCode, formData.hospitalAddress),
        representativeAddress: formatJapaneseAddress(formData.representativePostalCode, formData.representativeAddress),
        birthDate: convertDateToIso(birthDate),
        submissionType,
        applicationId: applicationUuid,
        representativeName: `${formData.representativeLastName} ${formData.representativeFirstName}`.trim(),
        representativeNameFurigana: `${formData.representativeLastNameFurigana} ${formData.representativeFirstNameFurigana}`.trim(),
        uploadedFiles: uploadedFiles.map(f => ({ name: f.name, size: f.size })),
        hasAttachments: uploadedFiles.length > 0,
        signature: signatureData
      };

      localStorage.setItem('applicationData', JSON.stringify(allData));

      toast.success(`申請を提出しました${uploadedFiles.length > 0 ? ` (添付ファイル: ${uploadedFiles.length}件)` : ''}`);
      router.push('/applications/complete');

    } catch (error: any) {
      console.error('Application submission error:', error);
      toast.error(error.response?.data?.message || '申請の提出に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleConfirmUpload = () => {
    setShowUploadModal(false);
  };

  const handleFileClick = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
    // Clean up the URL after a delay to free memory
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const getFileTooltip = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];

    if (extension && previewableTypes.includes(extension)) {
      return '新しいタブでプレビュー';
    }
    return 'ダウンロードして表示';
  };

  return (
    <div className="flex justify-center px-2 md:px-4">
      <style jsx>{spinnerStyles}</style>
      <div className="card max-w-4xl w-full">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col items-center justify-center mb-6">
            <h1 className="text-base md:text-lg font-bold text-center">
              リース審査申込画面 (販売店: デモ歯科商店)
            </h1>
          </div>

          <form className="space-y-8 relative">
            {/* Business Type Selection */}
            <div className="mb-6">
              <label htmlFor="businessType" className="text-sm font-medium text-gray-700 block mb-2">
                事業形態 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  id="businessTypeButton"
                  type="button"
                  onClick={() => setShowBusinessTypeDropdown(!showBusinessTypeDropdown)}
                  className={`w-full text-left border border-gray-300 rounded-md px-3 py-3 text-gray-700 rounded-md text-sm px-5 py-2.5 text-black inline-flex items-center justify-between ${fieldErrors.businessType ? 'ring-2 ring-red-500' : ''
                    }`}
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
                          className="block w-full text-left px-4 py-3 hover:bg-gray-100 focus:bg-gray-100"
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
                          className="block w-full text-left px-4 py-3 hover:bg-gray-100 focus:bg-gray-100"
                        >
                          個人事業主
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              {fieldErrors.businessType && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.businessType}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-y-6">
              <div className="md:pr-4">
                <label htmlFor="companyName" className="text-sm font-medium text-gray-700 block mb-2">
                  {formData.businessType === 'Corporation' ? '法人名' : 
                   formData.businessType === 'Individual' ? '代表者名' : 
                   '法人名'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder={formData.businessType === 'Corporation' ? '医療法人' : 
                              formData.businessType === 'Individual' ? '山田太郎' : 
                              '事業形態を選択してください'}
                  className={`w-full border rounded-md px-3 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {fieldErrors.companyName && (
                  <p className="mt-1 text-sm text-red-600">
                    {formData.businessType === 'Corporation' ? '法人名を入力してください' : 
                     formData.businessType === 'Individual' ? '代表者名を入力してください' : 
                     'この項目は必須です'}
                  </p>
                )}
              </div>
              <div className="md:pl-4">
                <label htmlFor="hospitalName" className="text-sm font-medium text-gray-700 block mb-2">
                  医院名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="hospitalName"
                  value={formData.hospitalName}
                  onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                  className={`w-full border rounded-md px-3 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.hospitalName ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {fieldErrors.hospitalName && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.hospitalName}</p>
                )}
              </div>

              <div className="md:pr-4">
                <label htmlFor="hospitalAddress" className="text-sm font-medium text-gray-700 block mb-2">
                  医院住所 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">〒</span>
                      <input
                        type="text"
                        placeholder="郵便番号 (例: 1000001)"
                        value={formData.hospitalPostalCode}
                        onChange={(e) => handlePostalCodeChange(e, 'hospitalPostalCode', 'hospitalAddress')}
                        maxLength={7}
                        className="w-full border rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ※ 7桁入力で住所が自動検索されます。
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      id="hospitalAddress"
                      placeholder={hospitalPostalLoading ? "住所を検索中..." : "住所（郵便番号から自動入力）"}
                      value={formData.hospitalAddress}
                      onChange={(e) => handleInputChange('hospitalAddress', e.target.value)}
                      className={`w-full border rounded-md px-3 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.hospitalAddress ? 'border-red-500' : 'border-gray-300'
                        } ${hospitalPostalLoading ? 'bg-blue-50' : ''}`}
                      disabled={hospitalPostalLoading}
                    />
                    {hospitalPostalLoading && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 mr-3">
                        <Spinner size="md" color="blue" />
                      </div>
                    )}
                  </div>
                </div>
                {hospitalAddressError && (
                  <p className="mt-1 text-sm text-red-600">{hospitalAddressError}</p>
                )}
                {fieldErrors.hospitalAddress && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.hospitalAddress}</p>
                )}
              </div>
              <div className="md:pl-4">
                <label htmlFor="hospitalTel" className="text-sm font-medium text-gray-700 block mb-2">
                  医院TEL <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="hospitalTel"
                  value={formData.hospitalTel}
                  onChange={(e) => handleInputChange('hospitalTel', e.target.value)}
                  className={`w-full border rounded-md px-3 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.hospitalTel ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {fieldErrors.hospitalTel && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.hospitalTel}</p>
                )}
              </div>

              <div className="md:pr-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  代表者名 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {/* Name fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="姓"
                        value={formData.representativeLastName}
                        onChange={(e) => handleInputChange('representativeLastName', e.target.value)}
                        className={`w-full border rounded-md px-3 py-3 text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.representativeLastName ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="名"
                        value={formData.representativeFirstName}
                        onChange={(e) => handleInputChange('representativeFirstName', e.target.value)}
                        className={`w-full border rounded-md px-3 py-3 text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.representativeFirstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                    </div>
                  </div>
                  
                  {/* Furigana fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">せい（ふりがな）</label>
                      <input
                        type="text"
                        placeholder="せい"
                        value={formData.representativeLastNameFurigana}
                        onChange={(e) => handleInputChange('representativeLastNameFurigana', e.target.value)}
                        className={`w-full border rounded-md px-3 py-2 text-sm text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${fieldErrors.representativeLastNameFurigana ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">めい（ふりがな）</label>
                      <input
                        type="text"
                        placeholder="めい"
                        value={formData.representativeFirstNameFurigana}
                        onChange={(e) => handleInputChange('representativeFirstNameFurigana', e.target.value)}
                        className={`w-full border rounded-md px-3 py-2 text-sm text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${fieldErrors.representativeFirstNameFurigana ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                    </div>
                  </div>
                </div>
                
                {(fieldErrors.representativeLastName || fieldErrors.representativeFirstName) && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.representativeLastName || fieldErrors.representativeFirstName}
                  </p>
                )}
                
                {(fieldErrors.representativeLastNameFurigana || fieldErrors.representativeFirstNameFurigana) && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.representativeLastNameFurigana || fieldErrors.representativeFirstNameFurigana}
                  </p>
                )}
              </div>

              <div className="md:pl-4">
                <label htmlFor="birthDate" className="text-sm font-medium text-gray-700 block mb-2">
                  生年月日 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="birthDate"
                    value={birthDateInput}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^\d]/g, '');

                      // Clear any existing birthDate error when user starts typing
                      if (fieldErrors.birthDate) {
                        setFieldErrors(prev => ({ ...prev, birthDate: '' }));
                      }

                      // Real-time validation and correction as user types
                      if (value.length >= 4) {
                        // Check and correct year
                        let year = parseInt(value.slice(0, 4));
                        const currentYear = new Date().getFullYear();
                        if (year < 1900) {
                          year = 1900;
                          value = '1900' + value.slice(4);
                        } else if (year > currentYear) {
                          year = currentYear;
                          value = currentYear.toString() + value.slice(4);
                        }
                      }

                      if (value.length >= 6) {
                        // Check and correct month
                        let month = parseInt(value.slice(4, 6));
                        if (month > 12) {
                          month = 12;
                          value = value.slice(0, 4) + '12' + value.slice(6);
                        } else if (month < 1 && value.slice(4, 6) === '00') {
                          month = 1;
                          value = value.slice(0, 4) + '01' + value.slice(6);
                        }
                      }

                      if (value.length >= 8) {
                        // Check and correct day
                        let day = parseInt(value.slice(6, 8));
                        if (day > 31) {
                          day = 31;
                          value = value.slice(0, 6) + '31' + value.slice(8);
                        } else if (day < 1 && value.slice(6, 8) === '00') {
                          day = 1;
                          value = value.slice(0, 6) + '01' + value.slice(8);
                        }

                        // Further validation for month-specific day limits
                        const year = parseInt(value.slice(0, 4));
                        const month = parseInt(value.slice(4, 6));

                        if (month === 2) {
                          // February - check for leap year
                          const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
                          const maxDay = isLeapYear ? 29 : 28;
                          if (day > maxDay) {
                            day = maxDay;
                            value = value.slice(0, 6) + String(maxDay).padStart(2, '0');
                          }
                        } else if ([4, 6, 9, 11].includes(month)) {
                          // April, June, September, November - 30 days
                          if (day > 30) {
                            day = 30;
                            value = value.slice(0, 6) + '30';
                          }
                        }
                      }

                      // Add slashes for formatting
                      if (value.length >= 5) {
                        value = value.slice(0, 4) + '/' + value.slice(4);
                      }
                      if (value.length >= 8) {
                        value = value.slice(0, 7) + '/' + value.slice(7, 9);
                      }

                      setBirthDateInput(value);

                      // Set the date object if complete and valid
                      if (value.length === 10) {
                        const [year, month, day] = value.split('/').map(Number);
                        const parsedDate = new Date(year, month - 1, day);

                        // Double-check that the date is valid and not in the future
                        if (parsedDate.getFullYear() === year &&
                          parsedDate.getMonth() === month - 1 &&
                          parsedDate.getDate() === day &&
                          parsedDate <= new Date()) {
                          setBirthDate(parsedDate);
                        } else {
                          setBirthDate(null);
                        }
                      } else {
                        setBirthDate(null);
                      }
                    }}
                    placeholder="YYYY/MM/DD"
                    maxLength={10}
                    className={`w-full border rounded-md px-3 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.birthDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    className="absolute inset-y-0 right-0 mr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {showDatePicker && (
                    <div className="absolute top-full left-0 z-50 mt-1">
                      <DatePicker
                        selected={birthDate}
                        onChange={(date: Date | null) => {
                          setBirthDate(date);
                          if (date) {
                            setBirthDateInput(formatDateJapanese(date));
                          }
                          setShowDatePicker(false);
                        }}
                        locale="ja"
                        dateFormat="yyyy/MM/dd"
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        yearDropdownItemNumber={100}
                        maxDate={new Date()}
                        openToDate={birthDate || new Date(new Date().getFullYear() - 50, new Date().getMonth(), new Date().getDate())}
                        inline
                      />
                    </div>
                  )}
                </div>
                {fieldErrors.birthDate && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.birthDate}</p>
                )}
              </div>

              <div className="md:pr-4">
                <label htmlFor="representativeAddress" className="text-sm font-medium text-gray-700 block mb-2">
                  代表者住所 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">〒</span>
                      <input
                        type="text"
                        placeholder="郵便番号 (例: 1000001)"
                        value={formData.representativePostalCode}
                        onChange={(e) => handlePostalCodeChange(e, 'representativePostalCode', 'representativeAddress')}
                        maxLength={7}
                        className="w-full border rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ※ 7桁入力で住所が自動検索されます。
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      id="representativeAddress"
                      placeholder={representativePostalLoading ? "住所を検索中..." : "住所（郵便番号から自動入力）"}
                      value={formData.representativeAddress}
                      onChange={(e) => handleInputChange('representativeAddress', e.target.value)}
                      className={`w-full border rounded-md px-3 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.representativeAddress ? 'border-red-500' : 'border-gray-300'
                        } ${representativePostalLoading ? 'bg-blue-50' : ''}`}
                      disabled={representativePostalLoading}
                    />
                    {representativePostalLoading && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 mr-3">
                        <Spinner size="md" color="blue" />
                      </div>
                    )}
                  </div>
                </div>
                {representativeAddressError && (
                  <p className="mt-1 text-sm text-red-600">{representativeAddressError}</p>
                )}
                {fieldErrors.representativeAddress && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.representativeAddress}</p>
                )}
              </div>
              <div className="md:pl-4">
                <label htmlFor="representativeTel" className="text-sm font-medium text-gray-700 block mb-2">
                  代表者TEL <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="representativeTel"
                  value={formData.representativeTel}
                  onChange={(e) => handleInputChange('representativeTel', e.target.value)}
                  className={`w-full border rounded-md px-3 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.representativeTel ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {fieldErrors.representativeTel && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.representativeTel}</p>
                )}
              </div>

              <div className="md:pr-4">
                <label htmlFor="propertyName" className="text-sm font-medium text-gray-700 block mb-2">
                  物件名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="propertyName"
                  value={formData.propertyName}
                  onChange={(e) => handleInputChange('propertyName', e.target.value)}
                  className={`w-full border rounded-md px-3 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.propertyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {fieldErrors.propertyName && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.propertyName}</p>
                )}
              </div>
              <div className="md:pl-4">
                <label htmlFor="amount" className="text-sm font-medium text-gray-700 block mb-2">
                  金額 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className={`w-full border rounded-md px-3 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.amount ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="5,000,000"
                  />
                  <span className="text-gray-700 text-sm whitespace-nowrap">円(税抜)</span>
                </div>
                {fieldErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.amount}</p>
                )}
              </div>
            </div>
          </form>

          <div className="mt-8">
            <div className="bg-gray-100 p-4 md:p-6 rounded-lg flex flex-col items-center justify-center">
              <h3 className="text-sm md:text-base text-center font-semibold text-gray-700 mb-2 md:mb-3">個人情報規約</h3>
              <p className="text-xs md:text-sm text-gray-600 text-center">プレイスホルダーテキスト</p>
            </div>
          </div>

          {/* ESignature Section */}
          <div className="mt-8">
            <div className="bg-white border-2 border-gray-300 rounded-lg p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm md:text-base font-semibold text-gray-900">
                  電子サイン <span className="text-red-500">*</span>
                </h3>
                {hasSignature && (
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="text-xs md:text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    クリア
                  </button>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-600 mb-4">
                以下のボックス内にマウスまたは指で署名してください。
              </p>
              <div className={`border-2 rounded-lg overflow-hidden ${fieldErrors.signature ? 'border-red-500' : 'border-gray-300'}`}>
                <SignatureCanvas
                  key={`signature-${canvasSize.width}-${canvasSize.height}`}
                  ref={setSignatureRef}
                  onBegin={handleSignatureBegin}
                  onEnd={handleSignatureEnd}
                  canvasProps={{
                    width: canvasSize.width,
                    height: canvasSize.height,
                    className: 'bg-white cursor-crosshair',
                    style: { 
                      touchAction: 'none',
                      width: `${canvasSize.width}px`,
                      height: `${canvasSize.height}px`,
                      display: 'block',
                      margin: '0 auto',
                      maxWidth: 'none',
                      maxHeight: 'none'
                    }
                  }}
                  backgroundColor="white"
                  penColor="black"
                />
              </div>
              {fieldErrors.signature && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.signature}</p>
              )}
              <div className="mt-2 flex items-center text-xs md:text-sm min-h-[1.5rem]">
                {hasSignature ? (
                  <>
                    <svg className="h-4 w-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-600">署名が完了しました</span>
                  </>
                ) : (
                  <span className="text-transparent"></span>
                )}
              </div>
            </div>
          </div>

          {/* Inline File Upload Section */}
          {isMobile && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">同意書添付（任意）</h3>
              <div className="border-2 border-dashed rounded-lg p-6 text-center border-gray-300 bg-gray-50">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ファイルを選択
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <p className="mt-3 text-xs text-gray-500">
                  PDF, JPG, PNG, DOC (最大10MB)
                </p>
              </div>
            </div>
          )}

          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                <h3 className="text-xs md:text-sm font-semibold text-blue-900 mb-3">
                  添付済みファイル ({uploadedFiles.length}件)
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 md:pr-2" style={{ maxHeight: 'min(48vh, 12rem)' }}>
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 md:p-3 bg-white rounded-lg shadow-sm"
                    >
                      <div
                        className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0 cursor-pointer hover:opacity-80"
                        onClick={() => handleFileClick(file.file)}
                        title={getFileTooltip(file.name)}
                      >
                        <DocumentIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="ml-2 md:ml-3 text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                        title="削除"
                      >
                        <XMarkIcon className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col md:flex-end justify-center gap-4 md:gap-6">
            {isMobile ? (
              <button
                type="button"
                onClick={() => handleSubmit(uploadedFiles.length > 0 ? 'withConsent' : 'direct')}
                disabled={isSubmitting}
                className="btn-primary px-6 py-3 w-full"
              >
                {isSubmitting ? '処理中...' : '同意して申込'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSubmitWithConsent}
                  disabled={isSubmitting}
                  className="btn-primary px-6 py-3 w-auto"
                >
                  {isSubmitting ? '処理中...' : '同意書添付して代理申込'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit(uploadedFiles.length > 0 ? 'withConsent' : 'direct')}
                  disabled={isSubmitting}
                  className="btn-primary px-6 py-3 w-auto"
                >
                  {isSubmitting ? '処理中...' : '同意して申込'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      {!isMobile && showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">同意書添付</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-4 md:px-6 py-4 overflow-y-auto flex-1">
              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-4 md:p-8 text-center transition-colors ${isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                  }`}
              >
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  ファイルをドラッグ&ドロップ
                </p>
                <p className="text-xs text-gray-500 mt-1">または</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ファイルを選択
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <p className="mt-2 text-xs text-gray-500">
                  PDF, JPG, PNG, DOC (最大10MB)
                </p>
              </div>

              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 md:mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    添付ファイル ({uploadedFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div
                          className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0 cursor-pointer hover:opacity-80"
                          onClick={() => handleFileClick(file.file)}
                          title={getFileTooltip(file.name)}
                        >
                          <DocumentIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="ml-2 md:ml-3 text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                          title="削除"
                        >
                          <XMarkIcon className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3 flex-shrink-0">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploadedFiles.length === 0}
                className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                確定 ({uploadedFiles.length}件添付)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
