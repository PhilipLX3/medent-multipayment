import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  TextField,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { api } from '@/shared/services/api';

interface ContractDetailModalProps {
  open: boolean;
  onClose: () => void;
  contractId: string;
  contractType: 'special' | 'regular';
}

interface ContractDetail {
  id: string;
  contractId: string;
  patient: {
    patientCode: string;
    lastName: string;
    firstName: string;
    phone: string;
    email: string;
  };
  clinic: {
    name: string;
  };
  contractDate: string;
  totalAmount: number;
  downPayment: number;
  loanAmount: number;
  numberOfPayments: number;
  monthlyPayment: number;
  serviceType: string;
  serviceCompletionRate: number;
  serviceStatus: string;
  serviceNotes: string;
  paymentStatus: string;
  totalPaid: number;
  remainingBalance: number;
  payments?: any[];
  serviceRecords?: any[];
  alerts?: any[];
}

const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  open,
  onClose,
  contractId,
  contractType
}) => {
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [editingService, setEditingService] = useState(false);
  const [serviceProgress, setServiceProgress] = useState({
    completionPercentage: 0,
    treatmentType: '',
    treatmentDetails: '',
    doctorName: '',
    notes: ''
  });

  useEffect(() => {
    if (open && contractId) {
      fetchContractDetail();
    }
  }, [open, contractId]);

  const fetchContractDetail = async () => {
    setLoading(true);
    try {
      const endpoint = contractType === 'special' 
        ? `/contracts/special/${contractId}`
        : `/contracts/regular/${contractId}`;
      
      const response = await api.get(endpoint);
      setContract(response.data.contract || response.data);
      
      if (response.data.contract) {
        setServiceProgress({
          completionPercentage: response.data.contract.serviceCompletionRate,
          treatmentType: '',
          treatmentDetails: '',
          doctorName: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch contract detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceProgressUpdate = async () => {
    try {
      await api.put(`/contracts/${contractId}/service-progress`, serviceProgress);
      setEditingService(false);
      fetchContractDetail();
    } catch (error) {
      console.error('Failed to update service progress:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'overdue': return 'error';
      case 'partially_paid': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            契約詳細 - {contract?.contractId}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <LinearProgress />
          </Box>
        ) : contract ? (
          <>
            {/* アラート表示 */}
            {contract.alerts && contract.alerts.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {contract.alerts.map((alert: any) => (
                  <Alert 
                    key={alert.id} 
                    severity={alert.alertLevel === 'critical' ? 'error' : alert.alertLevel}
                    sx={{ mb: 1 }}
                  >
                    <strong>{alert.title}</strong> - {alert.message}
                  </Alert>
                ))}
              </Box>
            )}

            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
              <Tab label="基本情報" />
              <Tab label="支払い情報" />
              <Tab label="役務消化" />
            </Tabs>

            {/* 基本情報タブ */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    患者情報
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography>
                      {contract.patient.lastName} {contract.patient.firstName} 
                      ({contract.patient.patientCode})
                    </Typography>
                    <Typography variant="body2">
                      電話: {contract.patient.phone || '-'}
                    </Typography>
                    <Typography variant="body2">
                      メール: {contract.patient.email || '-'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    契約情報
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography>
                      契約日: {format(new Date(contract.contractDate), 'yyyy年MM月dd日')}
                    </Typography>
                    <Typography>
                      治療内容: {contract.serviceType || '-'}
                    </Typography>
                    <Typography>
                      契約金額: {formatCurrency(contract.totalAmount)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="textSecondary">
                    支払い条件
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={3}>
                      <Typography variant="body2">頭金</Typography>
                      <Typography>{formatCurrency(contract.downPayment)}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">ローン金額</Typography>
                      <Typography>{formatCurrency(contract.loanAmount)}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">分割回数</Typography>
                      <Typography>{contract.numberOfPayments}回</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">月額</Typography>
                      <Typography>{formatCurrency(contract.monthlyPayment)}</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            )}

            {/* 支払い情報タブ */}
            {activeTab === 1 && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">
                        支払済み金額
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(contract.totalPaid)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">
                        残高
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(contract.remainingBalance)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">
                        支払い状況
                      </Typography>
                      <Chip
                        label={contract.paymentStatus}
                        color={getPaymentStatusColor(contract.paymentStatus)}
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {contract.payments && (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>回数</TableCell>
                          <TableCell>予定日</TableCell>
                          <TableCell>支払日</TableCell>
                          <TableCell align="right">予定額</TableCell>
                          <TableCell align="right">支払額</TableCell>
                          <TableCell>状態</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {contract.payments.map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.paymentNumber}</TableCell>
                            <TableCell>
                              {format(new Date(payment.scheduledDate), 'yyyy/MM/dd')}
                            </TableCell>
                            <TableCell>
                              {payment.actualPaymentDate 
                                ? format(new Date(payment.actualPaymentDate), 'yyyy/MM/dd')
                                : '-'
                              }
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(payment.scheduledAmount)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(payment.paidAmount)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={payment.paymentStatus}
                                color={getPaymentStatusColor(payment.paymentStatus)}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}

            {/* 役務消化タブ */}
            {activeTab === 2 && contractType === 'special' && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      役務消化進捗: {contract.serviceCompletionRate}%
                    </Typography>
                    {!editingService ? (
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => setEditingService(true)}
                      >
                        進捗更新
                      </Button>
                    ) : (
                      <Box>
                        <IconButton onClick={handleServiceProgressUpdate} color="primary">
                          <SaveIcon />
                        </IconButton>
                        <IconButton onClick={() => setEditingService(false)}>
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  <LinearProgress 
                    variant="determinate" 
                    value={contract.serviceCompletionRate} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />

                  {editingService && (
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="完了率 (%)"
                            type="number"
                            value={serviceProgress.completionPercentage}
                            onChange={(e) => setServiceProgress({
                              ...serviceProgress,
                              completionPercentage: parseInt(e.target.value)
                            })}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="施術種類"
                            value={serviceProgress.treatmentType}
                            onChange={(e) => setServiceProgress({
                              ...serviceProgress,
                              treatmentType: e.target.value
                            })}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="施術詳細"
                            value={serviceProgress.treatmentDetails}
                            onChange={(e) => setServiceProgress({
                              ...serviceProgress,
                              treatmentDetails: e.target.value
                            })}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="担当医師"
                            value={serviceProgress.doctorName}
                            onChange={(e) => setServiceProgress({
                              ...serviceProgress,
                              doctorName: e.target.value
                            })}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="備考"
                            value={serviceProgress.notes}
                            onChange={(e) => setServiceProgress({
                              ...serviceProgress,
                              notes: e.target.value
                            })}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>

                {contract.serviceRecords && contract.serviceRecords.length > 0 && (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>記録日</TableCell>
                          <TableCell>進捗率</TableCell>
                          <TableCell>施術種類</TableCell>
                          <TableCell>担当医師</TableCell>
                          <TableCell>備考</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {contract.serviceRecords.map((record: any) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {format(new Date(record.recordDate), 'yyyy/MM/dd')}
                            </TableCell>
                            <TableCell>{record.completionPercentage}%</TableCell>
                            <TableCell>{record.treatmentType || '-'}</TableCell>
                            <TableCell>{record.doctorName || '-'}</TableCell>
                            <TableCell>{record.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </>
        ) : (
          <Typography>契約情報が見つかりません</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractDetailModal;