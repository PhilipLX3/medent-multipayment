'use client';

import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import { useRouter } from 'next/navigation';
import api from '@/shared/services/api';

const ProjectCreatePage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    patient_id: '',
    patient_name: '',
    treatment_name: '',
    project_amount: '',
    loan_type: '分割払い',
    finance_company_name: 'アプラス',
    project_type: 'normal',
    status: 'pending',
    monthly_payment: '',
    payment_count: '24',
    interest_rate: '3.5'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const projectData = {
        ...formData,
        project_amount: parseFloat(formData.project_amount),
        monthly_payment: parseFloat(formData.monthly_payment || '0'),
        payment_count: parseInt(formData.payment_count),
        interest_rate: parseFloat(formData.interest_rate)
      };

      const response = await api.post('/v1/projects', projectData);
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/projects');
        }, 2000);
      } else {
        setError('案件の作成に失敗しました');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '案件の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          案件登録
        </Typography>

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="患者ID"
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="患者名"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="治療名"
                  name="treatment_name"
                  value={formData.treatment_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="案件金額"
                  name="project_amount"
                  type="number"
                  value={formData.project_amount}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>決済方法</InputLabel>
                  <Select
                    name="loan_type"
                    value={formData.loan_type}
                    onChange={handleSelectChange}
                    label="決済方法"
                  >
                    <MenuItem value="一括払い">一括払い</MenuItem>
                    <MenuItem value="分割払い">分割払い</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>ローン会社</InputLabel>
                  <Select
                    name="finance_company_name"
                    value={formData.finance_company_name}
                    onChange={handleSelectChange}
                    label="ローン会社"
                  >
                    <MenuItem value="アプラス">アプラス</MenuItem>
                    <MenuItem value="CBS">CBS</MenuItem>
                    <MenuItem value="セゾン">セゾン</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>案件種別</InputLabel>
                  <Select
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleSelectChange}
                    label="案件種別"
                  >
                    <MenuItem value="normal">通常ローン</MenuItem>
                    <MenuItem value="special">特別ローン</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>ステータス</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    label="ステータス"
                  >
                    <MenuItem value="pending">審査中</MenuItem>
                    <MenuItem value="approved">承認済</MenuItem>
                    <MenuItem value="completed">完了</MenuItem>
                    <MenuItem value="rejected">審査NG</MenuItem>
                    <MenuItem value="cancelled">キャンセル</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="月額支払額"
                  name="monthly_payment"
                  type="number"
                  value={formData.monthly_payment}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="支払回数"
                  name="payment_count"
                  type="number"
                  value={formData.payment_count}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="金利 (%)"
                  name="interest_rate"
                  type="number"
                  value={formData.interest_rate}
                  onChange={handleChange}
                  inputProps={{ step: '0.1' }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/projects')}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? '登録中...' : '案件を登録'}
              </Button>
            </Box>
          </form>
        </Paper>

        <Snackbar
          open={success}
          autoHideDuration={2000}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" sx={{ width: '100%' }}>
            案件を登録しました
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default ProjectCreatePage;
