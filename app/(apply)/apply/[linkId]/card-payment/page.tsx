'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  InputAdornment,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  CreditCard as CreditCardIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { api } from '@/shared';
import { DashboardLayout } from '@/shared/components/layouts';

const steps = ['金額確認', 'カード情報入力', '決済完了'];

export default function CardPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkId = searchParams?.get('linkId') || '';
  const amount = searchParams?.get('amount') || '';
  const plan = searchParams?.get('plan') || '';
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [savedCardInfo, setSavedCardInfo] = useState<any>(null);
  
  // カード情報
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('one-time');
  const [saveCard, setSaveCard] = useState(false);

  useEffect(() => {
    fetchPaymentInfo();
    checkSavedCard();
  }, [linkId]);

  const fetchPaymentInfo = async () => {
    try {
      const response = await api.get(`/payments/link/${linkId}`);
      const data = response.data;
      setPaymentInfo(data);
      
      // 新規決済依頼で入力された患者名をカード名欄に自動セット
      if (data.patient_name) {
        setCardName(data.patient_name);
      }
    } catch (error) {
      console.error('決済情報の取得に失敗しました:', error);
    }
  };

  const checkSavedCard = async () => {
    try {
      // localStorageまたはAPIから保存されたカード情報を取得
      const savedCardData = localStorage.getItem(`card_${linkId}`);
      if (savedCardData) {
        const cardData = JSON.parse(savedCardData);
        setSavedCardInfo(cardData);
        // 保存されたカード情報を自動セット（CVV以外）
        setCardNumber(cardData.cardNumber || '');
        setCardName(cardData.cardName || '');
        setExpiryMonth(cardData.expiryMonth || '');
        setExpiryYear(cardData.expiryYear || '');
      }
    } catch (error) {
      console.error('保存されたカード情報の取得に失敗:', error);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts: string[] = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      processPayment();
    }
  };

  const processPayment = async () => {
    setLoading(true);
    setError('');
    
    try {
      // カード情報を保存（選択された場合）
      if (saveCard) {
        const cardToSave = {
          cardNumber: cardNumber.replace(/\s/g, '').slice(-4), // 下4桁のみ保存
          cardName,
          expiryMonth,
          expiryYear,
        };
        localStorage.setItem(`card_${linkId}`, JSON.stringify(cardToSave));
      }
      
      // カード決済処理
      const paymentData = {
        linkId,
        amount,
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardName,
        expiryMonth,
        expiryYear,
        cvv,
        paymentMethod,
        saveCard,
      };
      
      const response = await api.post(`/payments/link/${linkId}/card-payment`, paymentData);
      
      if (response.data.success) {
        setActiveStep(2);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'カード決済処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push(`/apply/complete?type=card&amount=${amount}`);
  };

  if (!amount || !plan) {
    return (
      <DashboardLayout>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          支払い情報が見つかりません。最初からやり直してください。
        </Alert>
      </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              お支払い金額の確認
            </Typography>
            
            <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body1" color="text.secondary">
                    お支払い方法
                  </Typography>
                  <Typography variant="h6">
                    カード決済（一括払い）
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" color="text.secondary">
                    お支払い金額
                  </Typography>
                  <Typography variant="h4" color="primary">
                    ¥{amount.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              次の画面でクレジットカード情報を入力していただきます。
              SSL暗号化通信により、お客様の情報は安全に保護されます。
            </Alert>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleNext}
                endIcon={<CreditCardIcon />}
              >
                カード情報入力へ進む
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              クレジットカード情報
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <LockIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="body2" color="text.secondary">
                SSL暗号化通信で安全に送信されます
              </Typography>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="カード番号"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CreditCardIcon />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="カード名義人"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  placeholder="TARO YAMADA"
                  helperText="カードに記載されている通りに入力してください"
                  required
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="有効期限（月）"
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value)}
                  placeholder="MM"
                  inputProps={{ maxLength: 2 }}
                  required
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="有効期限（年）"
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value)}
                  placeholder="YY"
                  inputProps={{ maxLength: 2 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="セキュリティコード"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="123"
                  inputProps={{ maxLength: 4 }}
                  helperText="カード裏面の3〜4桁の数字"
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="mr-2"
                    />
                  }
                  label="次回のために今回のカード情報を保存する"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">お支払い方法</FormLabel>
                  <RadioGroup
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <FormControlLabel 
                      value="one-time" 
                      control={<Radio />} 
                      label="一括払い" 
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                disabled={loading}
              >
                戻る
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleNext}
                disabled={loading || !cardNumber || !cardName || !expiryMonth || !expiryYear || !cvv}
              >
                {loading ? '処理中...' : '決済を実行'}
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            
            <Typography variant="h4" gutterBottom>
              決済が完了しました
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              お支払いが正常に処理されました。
              ご利用ありがとうございます。
            </Typography>
            
            <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mb: 4 }}>
              <Typography variant="body2" color="text.secondary">
                決済金額
              </Typography>
              <Typography variant="h5">
                ¥{amount.toLocaleString()}
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleComplete}
            >
              完了
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
    </DashboardLayout>
  );
}