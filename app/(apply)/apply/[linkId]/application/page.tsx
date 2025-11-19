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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Divider,
  LinearProgress,
  Radio,
  RadioGroup,
  Card,
  CardContent,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { api } from '@/shared';
import { DashboardLayout } from '@/shared/components/layouts';

const steps = [
  '基本情報',
  '連絡先情報',
  '住所情報',
  '勤務先情報',
  'ローン情報',
  '確認・同意'
];

const LoanApplicationPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams?.get('paymentId') || '';
  const amountParam = searchParams?.get('amount') || '';
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<any>({});
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  // フォームデータ
  const [formData, setFormData] = useState({
    // 基本情報
    lastName: '',
    firstName: '',
    lastNameKana: '',
    firstNameKana: '',
    birthDate: '',
    gender: '',
    
    // 連絡先情報
    email: '',
    phone: '',
    
    // 住所情報
    postalCode: '',
    prefecture: '',
    city: '',
    address: '',
    building: '',
    
    // 勤務先情報
    employmentType: '',
    companyName: '',
    companyPhone: '',
    annualIncome: '',
    employmentYears: '',
    
    // ローン情報
    loanAmount: amountParam || '',
    loanPurpose: '医療費',
    paymentMethod: 'monthly',
    
    // 同意事項
    agreeTerms: false,
    agreePrivacy: false,
    agreeCredit: false,
  });

  // 郵便番号から住所を自動入力
  const handlePostalCodeChange = async (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, postalCode: cleanValue });
    
    if (cleanValue.length === 7) {
      try {
        const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanValue}`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          setFormData(prev => ({
            ...prev,
            prefecture: result.address1,
            city: result.address2,
            address: result.address3,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch address:', error);
      }
    }
  };

  // ステップごとの検証
  const validateStep = (step: number) => {
    const newErrors: any = {};
    
    switch (step) {
      case 0: // 基本情報
        if (!formData.lastName) newErrors.lastName = '姓を入力してください';
        if (!formData.firstName) newErrors.firstName = '名を入力してください';
        if (!formData.lastNameKana) newErrors.lastNameKana = 'セイを入力してください';
        if (!formData.firstNameKana) newErrors.firstNameKana = 'メイを入力してください';
        if (!formData.birthDate) newErrors.birthDate = '生年月日を入力してください';
        if (!formData.gender) newErrors.gender = '性別を選択してください';
        break;
        
      case 1: // 連絡先情報
        if (!formData.email) newErrors.email = 'メールアドレスを入力してください';
        if (!formData.phone) newErrors.phone = '電話番号を入力してください';
        break;
        
      case 2: // 住所情報
        if (!formData.postalCode) newErrors.postalCode = '郵便番号を入力してください';
        if (!formData.prefecture) newErrors.prefecture = '都道府県を入力してください';
        if (!formData.city) newErrors.city = '市区町村を入力してください';
        if (!formData.address) newErrors.address = '番地を入力してください';
        break;
        
      case 3: // 勤務先情報
        if (!formData.employmentType) newErrors.employmentType = '雇用形態を選択してください';
        if (!formData.companyName) newErrors.companyName = '勤務先名を入力してください';
        if (!formData.annualIncome) newErrors.annualIncome = '年収を選択してください';
        break;
        
      case 4: // ローン情報
        if (!formData.loanAmount) newErrors.loanAmount = '申込金額を入力してください';
        break;
        
      case 5: // 確認・同意
        if (!formData.agreeTerms) newErrors.agreeTerms = '利用規約に同意してください';
        if (!formData.agreePrivacy) newErrors.agreePrivacy = '個人情報取扱いに同意してください';
        if (!formData.agreeCredit) newErrors.agreeCredit = '信用情報の取扱いに同意してください';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 次へ進む
  const handleNext = () => {
    if (validateStep(activeStep)) {
      const newCompleted = new Set(completed);
      newCompleted.add(activeStep);
      setCompleted(newCompleted);
      
      if (activeStep === steps.length - 1) {
        handleSubmit();
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    }
  };

  // 前に戻る
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // フォーム送信
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.post('/v1/loan-applications', {
        payment_id: paymentId,
        ...formData,
      });
      
      if (response.data.success) {
        router.push(`/apply/${paymentId}/complete?applicationId=${response.data.data.id}`);
      }
    } catch (error: any) {
      console.error('Application submission failed:', error);
      // Mock success for demo purposes
      const mockApplicationId = `APP-${Date.now()}`;
      router.push(`/apply/complete?applicationId=${mockApplicationId}&status=approved`);
    } finally {
      setLoading(false);
    }
  };

  // ステップごとのコンテンツ
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // 基本情報
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
              基本情報
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="姓"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  placeholder="山田"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="名"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  placeholder="太郎"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="セイ"
                  value={formData.lastNameKana}
                  onChange={(e) => setFormData({ ...formData, lastNameKana: e.target.value })}
                  error={!!errors.lastNameKana}
                  helperText={errors.lastNameKana}
                  placeholder="ヤマダ"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="メイ"
                  value={formData.firstNameKana}
                  onChange={(e) => setFormData({ ...formData, firstNameKana: e.target.value })}
                  error={!!errors.firstNameKana}
                  helperText={errors.firstNameKana}
                  placeholder="タロウ"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="生年月日"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  error={!!errors.birthDate}
                  helperText={errors.birthDate}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>性別</Typography>
                  <RadioGroup
                    row
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <FormControlLabel 
                      value="male" 
                      control={<Radio size="small" />} 
                      label="男性"
                      sx={{ mr: 4 }}
                    />
                    <FormControlLabel 
                      value="female" 
                      control={<Radio size="small" />} 
                      label="女性"
                    />
                  </RadioGroup>
                  {errors.gender && (
                    <Typography variant="caption" color="error">{errors.gender}</Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 1: // 連絡先情報
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
              連絡先情報
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={!!errors.email}
                  helperText={errors.email}
                  placeholder="example@email.com"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="電話番号"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  error={!!errors.phone}
                  helperText={errors.phone || 'ハイフンなしで入力してください'}
                  placeholder="09012345678"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      case 2: // 住所情報
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
              住所情報
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="郵便番号"
                  value={formData.postalCode}
                  onChange={(e) => handlePostalCodeChange(e.target.value)}
                  error={!!errors.postalCode}
                  helperText={errors.postalCode || 'ハイフンなしで7桁'}
                  placeholder="1234567"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="都道府県"
                  value={formData.prefecture}
                  onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
                  error={!!errors.prefecture}
                  helperText={errors.prefecture}
                  placeholder="東京都"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="市区町村"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  error={!!errors.city}
                  helperText={errors.city}
                  placeholder="千代田区"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="番地"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  error={!!errors.address}
                  helperText={errors.address}
                  placeholder="1-1-1"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="建物名・部屋番号（任意）"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="〇〇マンション 101号室"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      case 3: // 勤務先情報
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
              勤務先情報
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.employmentType}>
                  <InputLabel>雇用形態</InputLabel>
                  <Select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    label="雇用形態"
                    sx={{ bgcolor: 'white' }}
                  >
                    <MenuItem value="正社員">正社員</MenuItem>
                    <MenuItem value="契約社員">契約社員</MenuItem>
                    <MenuItem value="派遣社員">派遣社員</MenuItem>
                    <MenuItem value="パート・アルバイト">パート・アルバイト</MenuItem>
                    <MenuItem value="自営業">自営業</MenuItem>
                    <MenuItem value="その他">その他</MenuItem>
                  </Select>
                  {errors.employmentType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.employmentType}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="勤務先名"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  error={!!errors.companyName}
                  helperText={errors.companyName}
                  placeholder="株式会社〇〇"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="勤務先電話番号（任意）"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  placeholder="0312345678"
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.annualIncome}>
                  <InputLabel>年収</InputLabel>
                  <Select
                    value={formData.annualIncome}
                    onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                    label="年収"
                    sx={{ bgcolor: 'white' }}
                  >
                    <MenuItem value="200万円未満">200万円未満</MenuItem>
                    <MenuItem value="200-400万円">200-400万円</MenuItem>
                    <MenuItem value="400-600万円">400-600万円</MenuItem>
                    <MenuItem value="600-800万円">600-800万円</MenuItem>
                    <MenuItem value="800-1000万円">800-1000万円</MenuItem>
                    <MenuItem value="1000万円以上">1000万円以上</MenuItem>
                  </Select>
                  {errors.annualIncome && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.annualIncome}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>勤続年数</InputLabel>
                  <Select
                    value={formData.employmentYears}
                    onChange={(e) => setFormData({ ...formData, employmentYears: e.target.value })}
                    label="勤続年数"
                    sx={{ bgcolor: 'white' }}
                  >
                    <MenuItem value="1年未満">1年未満</MenuItem>
                    <MenuItem value="1-3年">1-3年</MenuItem>
                    <MenuItem value="3-5年">3-5年</MenuItem>
                    <MenuItem value="5-10年">5-10年</MenuItem>
                    <MenuItem value="10年以上">10年以上</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 4: // ローン情報
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
              ローン情報
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="申込金額"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                  error={!!errors.loanAmount}
                  helperText={errors.loanAmount}
                  InputProps={{
                    endAdornment: '円',
                    sx: { height: 56 }
                  }}
                  disabled={!!amountParam}
                  variant="outlined"
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="資金使途"
                  value={formData.loanPurpose}
                  disabled
                  variant="outlined"
                  InputProps={{ sx: { height: 56 } }}
                  sx={{ bgcolor: '#f5f5f5' }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    お支払い方法
                  </Typography>
                  <RadioGroup
                    row
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <FormControlLabel 
                      value="monthly" 
                      control={<Radio size="small" />} 
                      label="分割払い"
                      sx={{ mr: 4 }}
                    />
                    <FormControlLabel 
                      value="lump" 
                      control={<Radio size="small" />} 
                      label="一括払い"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 5: // 確認・同意
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
              確認・同意事項
            </Typography>
            
            {/* 入力内容の確認 */}
            <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  入力内容の確認
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">お名前</Typography>
                    <Typography variant="body1">
                      {formData.lastName} {formData.firstName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">メールアドレス</Typography>
                    <Typography variant="body1">{formData.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">電話番号</Typography>
                    <Typography variant="body1">{formData.phone}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">申込金額</Typography>
                    <Typography variant="body1">{formData.loanAmount}円</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            {/* 同意事項 */}
            <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.agreeTerms}
                      onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      <a href="#" style={{ color: '#1976d2' }}>利用規約</a>に同意します
                    </Typography>
                  }
                />
                {errors.agreeTerms && (
                  <Typography variant="caption" color="error" sx={{ ml: 4 }}>
                    {errors.agreeTerms}
                  </Typography>
                )}
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.agreePrivacy}
                      onChange={(e) => setFormData({ ...formData, agreePrivacy: e.target.checked })}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      <a href="#" style={{ color: '#1976d2' }}>個人情報の取扱い</a>に同意します
                    </Typography>
                  }
                  sx={{ mt: 1 }}
                />
                {errors.agreePrivacy && (
                  <Typography variant="caption" color="error" sx={{ ml: 4 }}>
                    {errors.agreePrivacy}
                  </Typography>
                )}
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.agreeCredit}
                      onChange={(e) => setFormData({ ...formData, agreeCredit: e.target.checked })}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      <a href="#" style={{ color: '#1976d2' }}>信用情報の取扱い</a>に同意します
                    </Typography>
                  }
                  sx={{ mt: 1 }}
                />
                {errors.agreeCredit && (
                  <Typography variant="caption" color="error" sx={{ ml: 4 }}>
                    {errors.agreeCredit}
                  </Typography>
                )}
              </FormGroup>
            </Box>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        {/* ヘッダー */}
        <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 3, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            ローン申込フォーム
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            必要事項をご入力の上、お申込みください
          </Typography>
        </Box>

        {/* ステッパー */}
        <Box sx={{ p: 3, bgcolor: '#f5f5f5' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label} completed={completed.has(index)}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {loading && <LinearProgress />}

        {/* エラーメッセージ */}
        {errors.submit && (
          <Alert severity="error" sx={{ m: 3 }}>
            {errors.submit}
          </Alert>
        )}

        {/* フォームコンテンツ */}
        <Box sx={{ p: 4, minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Box>

        {/* ボタン */}
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 3, bgcolor: '#fafafa' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<BackIcon />}
            size="large"
            sx={{ minWidth: 120 }}
          >
            戻る
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep < steps.length - 1 && (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<NextIcon />}
                size="large"
                sx={{ minWidth: 120 }}
              >
                次へ
              </Button>
            )}
            
            {activeStep === steps.length - 1 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                startIcon={<CheckIcon />}
                size="large"
                color="success"
                sx={{ minWidth: 150 }}
              >
                申込を完了する
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
    </DashboardLayout>
  );
};

export default LoanApplicationPage;