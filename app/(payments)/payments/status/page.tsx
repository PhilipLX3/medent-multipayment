'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  LinearProgress,
  Avatar,
  Fade,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { api } from '@/shared';
import { DashboardLayout } from '@/shared/components/layouts';

interface PaymentStatus {
  id: string;
  application_number: string;
  applicant_name: string;
  amount: number;
  status: string;
  status_name_jp: string;
  badge_color: string;
  status_category: string;
  clinic_name: string;
  created_at: string;
  updated_at: string;
  hours_since_application: number;
  status_group: string;
}

interface StatusStatistics {
  status_code: string;
  status_name_jp: string;
  badge_color: string;
  count: number;
  avg_amount: number;
  total_amount: number;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PAYMENT_COMPLETED':
    case 'APPROVED':
    case 'SPECIAL_APPROVED':
      return <CheckIcon fontSize="small" />;
    case 'REJECTED':
    case 'SPECIAL_REJECTED':
      return <CancelIcon fontSize="small" />;
    case 'REVIEWING':
    case 'SPECIAL_REVIEWING':
    case 'PAYMENT_ESTIMATING':
      return <ScheduleIcon fontSize="small" />;
    default:
      return <PaymentIcon fontSize="small" />;
  }
};

const getChipColor = (badgeColor: string): any => {
  const colorMap: { [key: string]: any } = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
    purple: 'secondary',
    default: 'default',
  };
  return colorMap[badgeColor] || 'default';
};

export default function PaymentStatusDashboard() {
  const clinicId = 'a1a7f5e7-41af-4332-af96-b6e089804477';//Hardcode something for now this page might be removed later
  const [payments, setPayments] = useState<PaymentStatus[]>([]);
  const [statistics, setStatistics] = useState<StatusStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentStatus | null>(null);

  useEffect(() => {
    fetchPayments();
    fetchStatistics();
    // 30秒ごとに自動更新
    const interval = setInterval(() => {
      fetchPayments();
      fetchStatistics();
    }, 30000);
    return () => clearInterval(interval);
  }, [clinicId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/v1/payments/status-dashboard', {
        params: { clinic_id: clinicId }
      });
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/v1/payments/statistics', {
        params: { clinic_id: clinicId }
      });
      setStatistics(response.data.data || []);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: PaymentStatus) => {
    setAnchorEl(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPayment(null);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedPayment) return;
    
    try {
      await api.put(`/v1/payments/${selectedPayment.id}/status`, {
        status: newStatus,
        notes: `手動でステータスを${newStatus}に変更`
      });
      fetchPayments();
      handleMenuClose();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.application_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || payment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProcessingTime = (hours: number) => {
    if (hours < 1) return '1時間以内';
    if (hours < 24) return `${Math.floor(hours)}時間`;
    return `${Math.floor(hours / 24)}日`;
  };

  return (
    <DashboardLayout>
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in timeout={500}>
        <Box>
          {/* ヘッダー */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                決済ステータス管理
              </Typography>
              <Typography variant="body1" color="text.secondary">
                デンタルリースの窓口 の決済申込み状況
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchPayments}
              disabled={loading}
            >
              更新
            </Button>
          </Box>

          {/* 統計カード */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statistics.slice(0, 4).map((stat) => (
              <Grid item xs={12} sm={6} md={3} key={stat.status_code}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: `${stat.badge_color}.main`, width: 48, height: 48 }}>
                        {getStatusIcon(stat.status_code)}
                      </Avatar>
                      <Typography variant="h4" fontWeight="bold">
                        {stat.count}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.status_name_jp}
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(stat.total_amount || 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      平均: {formatCurrency(stat.avg_amount || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* フィルター */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="申込者名または申込番号で検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label="全て"
                    onClick={() => setFilterStatus('all')}
                    color={filterStatus === 'all' ? 'primary' : 'default'}
                    variant={filterStatus === 'all' ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label="決済完了"
                    onClick={() => setFilterStatus('PAYMENT_COMPLETED')}
                    color={filterStatus === 'PAYMENT_COMPLETED' ? 'success' : 'default'}
                    variant={filterStatus === 'PAYMENT_COMPLETED' ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label="審査OK"
                    onClick={() => setFilterStatus('APPROVED')}
                    color={filterStatus === 'APPROVED' ? 'success' : 'default'}
                    variant={filterStatus === 'APPROVED' ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label="審査中"
                    onClick={() => setFilterStatus('REVIEWING')}
                    color={filterStatus === 'REVIEWING' ? 'warning' : 'default'}
                    variant={filterStatus === 'REVIEWING' ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label="審査NG"
                    onClick={() => setFilterStatus('REJECTED')}
                    color={filterStatus === 'REJECTED' ? 'error' : 'default'}
                    variant={filterStatus === 'REJECTED' ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label="特別審査中"
                    onClick={() => setFilterStatus('SPECIAL_REVIEWING')}
                    color={filterStatus === 'SPECIAL_REVIEWING' ? 'secondary' : 'default'}
                    variant={filterStatus === 'SPECIAL_REVIEWING' ? 'filled' : 'outlined'}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* テーブル */}
          <Paper sx={{ overflow: 'hidden' }}>
            {loading && <LinearProgress />}
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>申込番号</TableCell>
                    <TableCell>申込者名</TableCell>
                    <TableCell align="right">申込金額</TableCell>
                    <TableCell align="center">ステータス</TableCell>
                    <TableCell>申込日時</TableCell>
                    <TableCell>処理時間</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow 
                      key={payment.id}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        opacity: payment.status_group === 'error' ? 0.7 : 1,
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {payment.application_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {payment.applicant_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(payment.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={payment.status_name_jp}
                          color={getChipColor(payment.badge_color)}
                          size="small"
                          icon={getStatusIcon(payment.status)}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatDate(payment.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {getProcessingTime(payment.hours_since_application)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="アクション">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, payment)}
                          >
                            <MoreIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {filteredPayments.length === 0 && !loading && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  該当する決済情報がありません
                </Typography>
              </Box>
            )}
          </Paper>

          {/* アクションメニュー */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleStatusUpdate('REVIEWING')}>
              審査中に変更
            </MenuItem>
            <MenuItem onClick={() => handleStatusUpdate('APPROVED')}>
              審査OKに変更
            </MenuItem>
            <MenuItem onClick={() => handleStatusUpdate('SPECIAL_REVIEWING')}>
              特別審査に回す
            </MenuItem>
            <MenuItem onClick={() => handleStatusUpdate('PAYMENT_COMPLETED')}>
              決済完了にする
            </MenuItem>
            <MenuItem onClick={() => handleStatusUpdate('CANCELLED')}>
              キャンセル
            </MenuItem>
          </Menu>
        </Box>
      </Fade>
    </Container>
    </DashboardLayout>
  );
}