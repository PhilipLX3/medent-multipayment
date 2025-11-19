'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Slider,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { api } from '@/shared';
import { DashboardLayout } from '@/shared/components/layouts';

interface PaymentInfo {
  clinic_name: string;
  treatment_name?: string;
  amount?: number;
  patient_id?: string;
  patient_name?: string;
}

interface PaymentPlan {
  type: 'full' | 'installment' | 'custom';
  label: string;
  months: number;
  monthlyPayment: number;
  totalPayment: number;
  interestRate: number;
  fee: number;
}

export default function PaymentPlanSelection() {
  const router = useRouter();
  const params = useParams();
  const linkId = params?.linkId as string;
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [displayAmount, setDisplayAmount] = useState<string>('');
  const [isAmountFixed, setIsAmountFixed] = useState(false);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [_selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [customMonths, setCustomMonths] = useState(12);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  // 数字にカンマを追加する関数（先頭の0を削除）
  const formatNumberWithCommas = (value: string): string => {
    // 数字以外を削除
    let numbers = value.replace(/[^0-9]/g, '');
    // 先頭の0を削除（ただし、値が"0"の場合は残す）
    numbers = numbers.replace(/^0+(?=\d)/, '');
    // 空の場合は空文字を返す
    if (!numbers) return '';
    // カンマを追加
    const num = parseInt(numbers, 10);
    return num.toLocaleString('ja-JP');
  };

  // カンマを削除して数値に変換
  const parseFormattedNumber = (value: string): number => {
    const numbers = value.replace(/[^0-9]/g, '');
    return numbers ? parseInt(numbers, 10) : 0;
  };

  useEffect(() => {
    fetchPaymentInfo();
  }, [linkId]);

  const fetchPaymentInfo = async () => {
    try {
      const response = await api.get(`/public/payments/link/${linkId}`);
      const data = response.data;
      setPaymentInfo(data);
      
      if (data.amount && data.amount > 0) {
        setAmount(data.amount);
        setDisplayAmount(formatNumberWithCommas(data.amount.toString()));
        // 金額が設定されていても常に編集可能にする
        setIsAmountFixed(false);
        calculatePlans(data.amount);
      } else {
        // 金額が未設定の場合は、空の状態で入力可能にする
        setAmount(0);
        setDisplayAmount('');
        setIsAmountFixed(false);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Payment information fetch error:', error);
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    if (!isAmountFixed) {
      const formatted = formatNumberWithCommas(value);
      setDisplayAmount(formatted);
      const numericValue = parseFormattedNumber(value);
      setAmount(numericValue);
      //Was 10000
      if (numericValue >= 1) {
        calculatePlans(numericValue);
      }
    }
  };

  const calculatePlans = (totalAmount: number) => {
    const plans: PaymentPlan[] = [
      // 一括払いプラン
      {
        type: 'full',
        label: '一括払い',
        months: 1,
        monthlyPayment: totalAmount,
        totalPayment: totalAmount,
        interestRate: 0,
        fee: 0,
      },
      // 12回分割プラン
      {
        type: 'installment',
        label: '12回分割',
        months: 12,
        monthlyPayment: Math.ceil((totalAmount * 1.05) / 12),
        totalPayment: Math.ceil(totalAmount * 1.05),
        interestRate: 5,
        fee: Math.ceil(totalAmount * 0.05),
      },
      // 24回分割プラン
      {
        type: 'installment',
        label: '24回分割',
        months: 24,
        monthlyPayment: Math.ceil((totalAmount * 1.10) / 24),
        totalPayment: Math.ceil(totalAmount * 1.10),
        interestRate: 10,
        fee: Math.ceil(totalAmount * 0.10),
      },
    ];
    
    setPaymentPlans(plans);
  };

  const calculateCustomPlan = (months: number): PaymentPlan => {
    let interestRate = 0;
    if (months <= 6) {
      interestRate = 3;
    } else if (months <= 12) {
      interestRate = 5;
    } else if (months <= 24) {
      interestRate = 10;
    } else if (months <= 36) {
      interestRate = 15;
    } else {
      interestRate = 20;
    }
    
    const totalPayment = Math.ceil(amount * (1 + interestRate / 100));
    const monthlyPayment = Math.ceil(totalPayment / months);
    
    return {
      type: 'custom',
      label: `${months}回分割（カスタム）`,
      months,
      monthlyPayment,
      totalPayment,
      interestRate,
      fee: totalPayment - amount,
    };
  };

  const handlePlanSelect = (plan: PaymentPlan) => {
    if (plan.type === 'full') {
      // 一括払いの場合はカード決済画面へ
      router.push(`/apply/${linkId}/card-payment`);
    } else if (plan.type === 'custom') {
      // カスタムプランの場合はシミュレーション画面を表示
      setShowCustomDialog(true);
    } else {
      // 分割払いの場合は複数ローン会社自動審査へ
      setSelectedPlan(plan);
      router.push(`/apply/${linkId}/loan-selection`);
    }
  };

  const handleCustomPlanConfirm = () => {
    const customPlan = calculateCustomPlan(customMonths);
    setSelectedPlan(customPlan);
    setShowCustomDialog(false);
    router.push(`/apply/${linkId}/loan-selection`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography>読み込み中...</Typography>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        {/* ヘッダー */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            お支払いプラン選択
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {paymentInfo?.clinic_name || '医療機関'}
          </Typography>
          {paymentInfo?.treatment_name && (
            <Chip label={paymentInfo.treatment_name} sx={{ mt: 1 }} />
          )}
          {paymentInfo?.patient_name && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {paymentInfo.patient_name} 様
            </Typography>
          )}
        </Box>

        {/* Step 1: 金額入力 */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h6" gutterBottom>
            1. お支払い金額
          </Typography>
          <TextField
            fullWidth
            type="text"
            value={displayAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="100,000"
            InputProps={{
              startAdornment: <InputAdornment position="start">¥</InputAdornment>,
            }}
            helperText="治療費の総額を入力してください（変更可能）"
            sx={{ maxWidth: 400 }}
          />
        </Box>

        {/* Step 2: プラン選択、１００００だった */}
        {amount >= 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              2. お支払いプランを選択
            </Typography>
            
            <Grid container spacing={3}>
              {/* 標準プラン */}
              {paymentPlans.map((plan) => {
                const isDisabled = plan.type === 'full';
                return (
                  <Grid size={{ xs: 12, md: 4 }} key={plan.label}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s',
                        opacity: isDisabled ? 0.6 : 1,
                        '&:hover': !isDisabled ? {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        } : {}
                      }}
                      onClick={() => !isDisabled && handlePlanSelect(plan)}
                    >
                      <CardContent>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          {plan.type === 'full' ? (
                            <CreditCardIcon sx={{ fontSize: 48, color: isDisabled ? 'text.disabled' : 'primary.main' }} />
                          ) : (
                            <PaymentIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                          )}
                        </Box>
                        
                        <Typography 
                          variant="h5" 
                          align="center" 
                          gutterBottom
                          color={isDisabled ? 'text.disabled' : 'text.primary'}
                        >
                          {plan.label}
                        </Typography>
                        
                        {isDisabled && (
                          <Typography 
                            variant="body2" 
                            align="center" 
                            color="text.disabled"
                            sx={{ mb: 2 }}
                          >
                            現在ご利用いただけません
                          </Typography>
                        )}
                        
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            月々のお支払い
                          </Typography>
                          <Typography 
                            variant="h4" 
                            color={isDisabled ? 'text.disabled' : 'primary'}
                          >
                            ¥{plan.monthlyPayment.toLocaleString()}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            お支払い総額
                          </Typography>
                          <Typography 
                            variant="h6"
                            color={isDisabled ? 'text.disabled' : 'text.primary'}
                          >
                            ¥{plan.totalPayment.toLocaleString()}
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <CardActions>
                        <Button 
                          fullWidth 
                          variant="contained" 
                          color="primary"
                          disabled={isDisabled}
                        >
                          {isDisabled ? '現在ご利用いただけません' : 'このプランを選択'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
              
              {/* カスタムプラン */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    }
                  }}
                  onClick={() => setShowCustomDialog(true)}
                >
                  <CardContent>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <CalculateIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                    </Box>
                    
                    <Typography variant="h5" align="center" gutterBottom>
                      カスタマイズプラン
                    </Typography>
                    
                    <Typography variant="body1" align="center" sx={{ mt: 3, mb: 4 }}>
                      お好みの分割回数で
                      シミュレーション
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" align="center">
                      3〜60回まで自由に設定可能
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button fullWidth variant="outlined" color="primary">
                      シミュレーションする
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* カスタムプラン シミュレーションダイアログ */}
        <Dialog
          open={showCustomDialog}
          onClose={() => setShowCustomDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            カスタマイズプラン シミュレーション
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>
                分割回数: {customMonths}回
              </Typography>
              <Slider
                value={customMonths}
                onChange={(_e, value) => setCustomMonths(value as number)}
                min={3}
                max={60}
                marks={[
                  { value: 3, label: '3回' },
                  { value: 12, label: '12回' },
                  { value: 24, label: '24回' },
                  { value: 36, label: '36回' },
                  { value: 48, label: '48回' },
                  { value: 60, label: '60回' },
                ]}
                valueLabelDisplay="auto"
              />
              
              <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">
                      月々のお支払い
                    </Typography>
                    <Typography variant="h5" color="primary">
                      ¥{calculateCustomPlan(customMonths).monthlyPayment.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="body2" color="text.secondary">
                      お支払い総額
                    </Typography>
                    <Typography variant="h5">
                      ¥{calculateCustomPlan(customMonths).totalPayment.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                分割回数が多いほど月々の負担は軽くなります。
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCustomDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCustomPlanConfirm} variant="contained" color="primary">
              このプランで申し込む
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
    </DashboardLayout>
  );
}