'use client';
import { useState, useEffect } from 'react';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  AccountBalance as BankIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { api } from '@/shared';
import { DashboardLayout } from '@/shared/components/layouts';

interface PaymentPlan {
  type: 'full' | 'installment' | 'custom';
  label: string;
  months: number;
  monthlyPayment: number;
  totalPayment: number;
  interestRate: number;
  fee: number;
}

interface LoanCompany {
  code: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  priority?: number;
}

interface ApplicationResult {
  companyCode: string;
  status: 'pending' | 'approved' | 'rejected' | 'error';
  message: string;
  applicationId?: string;
}

export default function LoanSelection() {
  const router = useRouter();
  const params = useParams();
  const linkId = params?.linkId as string;
  const searchParams = useSearchParams();
  const amount = parseInt(searchParams?.get('amount') || '0');
  const planLabel = searchParams?.get('plan') || '';
  const plan: PaymentPlan = {
    type: 'installment',
    label: planLabel,
    months: 12,
    monthlyPayment: Math.ceil(amount / 12),
    totalPayment: amount,
    interestRate: 0,
    fee: 0
  };

  const [availableCompanies, setAvailableCompanies] = useState<LoanCompany[]>([]);
  const [applicationResults, setApplicationResults] = useState<ApplicationResult[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const steps = ['審査会社選択', '自動審査実行', '審査結果確認', '申込完了'];

  useEffect(() => {
    fetchAvailableLoanCompanies();
  }, []);

  const fetchAvailableLoanCompanies = async () => {
    try {
      const response = await api.get('/public/loan-companies');
      console.log('Loan companies API response:', response.data);
      
      // APIレスポンスが配列であることを確認
      const companiesData = Array.isArray(response.data) ? response.data : [];
      console.log('Companies data:', companiesData);
      console.log('Amount to filter:', amount);
      
      let companies = companiesData.filter((company: LoanCompany) => {
        const isValid = amount >= company.minAmount && amount <= company.maxAmount;
        console.log(`Company ${company.name}: min=${company.minAmount}, max=${company.maxAmount}, amount=${amount}, valid=${isValid}`);
        return isValid;
      });
      
      // 優先順位でソート（priorityが小さい順）
      companies.sort((a: LoanCompany, b: LoanCompany) => {
        return (a.priority || 999) - (b.priority || 999);
      });
      
      // すべての対象会社を優先順位順に設定（順番に審査するため）
      console.log('Filtered companies:', companies);
      console.log('Companies will be processed in priority order:', companies.map(c => `${c.name}(priority:${c.priority || 999})`));
      
      setAvailableCompanies(companies);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch loan companies:', error);
      // フォールバックデータを設定
      const fallbackCompanies = [
        {
          code: 'CBS',
          name: 'シービーエス',
          description: '審査スピード重視・即日対応可能',
          minAmount: 10000,
          maxAmount: 1000000,
          priority: 1
        }
      ];
      setAvailableCompanies(fallbackCompanies);
      setLoading(false);
    }
  };

  const handleStartApplication = () => {
    // 個人情報入力画面に遷移
    router.push(`/apply/${linkId}/application?amount=${amount}&plan=${encodeURIComponent(plan.label)}&paymentId=${linkId}`);
  };

  const handleCompleteProcess = () => {
    const approvedResult = applicationResults.find(result => result.status === 'approved');
    
    if (approvedResult) {
      // 承認された会社がある場合
      router.push(`/apply/complete?amount=${amount}&status=approved&company=${approvedResult.companyCode}&applicationId=${approvedResult.applicationId}`);
    } else {
      // すべて却下の場合
      router.push(`/apply/complete?amount=${amount}&status=rejected`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckIcon color="success" />;
      case 'rejected':
        return <ErrorIcon color="error" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon color="primary" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCompanyDisplayName = (code: string) => {
    const company = availableCompanies.find(c => c.code === code);
    return company ? company.name : code;
  };

  if (loading) {
    return (
      <DashboardLayout>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
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
            ローン自動審査申込み
          </Typography>
          <Typography variant="body1" color="text.secondary">
            優先順位の高いローン会社から順番に審査申請を行います
          </Typography>
        </Box>

        {/* ステッパー */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* プラン情報 */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>選択プラン:</strong> {plan.label} | 
            <strong> 月々:</strong> ¥{plan.monthlyPayment.toLocaleString()} | 
            <strong> 総額:</strong> ¥{plan.totalPayment.toLocaleString()}
          </Typography>
        </Alert>

        {currentStep === 0 && (
          <Box>
            {/* プラン詳細表示 */}
            <Card sx={{ mb: 4, backgroundColor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" align="center" sx={{ mb: 3 }}>
                  選択されたお支払いプラン
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        分割回数
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {plan.months}回
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        月々のお支払い
                      </Typography>
                      <Typography variant="h5" color="primary">
                        ¥{plan.monthlyPayment.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        総支払額
                      </Typography>
                      <Typography variant="h5" color="primary">
                        ¥{plan.totalPayment.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Typography variant="body1" align="center" sx={{ mb: 4 }}>
              審査システムが自動的に最適なローン会社を選択し、順次審査を行います。
            </Typography>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleStartApplication}
                sx={{ minWidth: 250 }}
              >
                自動審査を開始する
              </Button>
            </Box>
          </Box>
        )}

        {currentStep >= 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              審査進捗状況
            </Typography>
            
            {/* 現在審査中の会社を表示 */}
            {isProcessing && applicationResults.length < availableCompanies.length && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>審査中</AlertTitle>
                <Typography variant="body2">
                  現在、<strong>{availableCompanies[applicationResults.length]?.name}</strong> の審査を行っています...
                </Typography>
              </Alert>
            )}
            
            {applicationResults.map((result) => (
              <Card key={result.companyCode} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                      {getStatusIcon(result.status)}
                      <Box>
                        <Typography variant="h6">
                          {getCompanyDisplayName(result.companyCode)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {result.message}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={result.status}
                      color={getStatusColor(result.status) as any}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}

            {isProcessing && (
              <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!isProcessing && currentStep >= 2 && (
              <Box sx={{ mt: 4 }}>
                {applicationResults.some(r => r.status === 'approved') ? (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <AlertTitle>審査承認</AlertTitle>
                    ローン審査が承認されました。次のステップに進んでください。
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <AlertTitle>審査完了</AlertTitle>
                    すべての審査が完了しました。結果をご確認ください。
                  </Alert>
                )}
                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleCompleteProcess}
                  >
                    審査結果を確認する
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
    </DashboardLayout>
  );
}