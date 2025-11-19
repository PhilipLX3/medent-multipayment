'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Badge,
  Typography,
  Alert,
  CircularProgress,
  Tooltip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid as GridLegacy
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import ja from 'date-fns/locale/ja';
import { useRouter } from 'next/navigation';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { api } from '@/shared/services/api';
import ContractDetailModal from './_components/ContractDetailModal';
import DashboardLayout from '@/shared/components/layouts/DashboardLayout';

interface Contract {
  id: string;
  contractId: string;
  patient: {
    patientCode: string;
    lastName: string;
    firstName: string;
  };
  contractDate: string;
  totalAmount: number;
  serviceCompletionRate: number;
  serviceStatus: string;
  serviceType?: string;
  paymentStatus: string;
  paymentProgress: number;
  payment_method: string;
  payment_type: string;
  financeCompany?: {
    name: string;
  };
  hasAlert: boolean;
  alertType?: string;
  status: string;
  isFullyCompleted?: boolean;
  shouldShowAlert?: boolean;
}

const ContractList: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [specialContracts, setSpecialContracts] = useState<Contract[]>([]);
  const [regularContracts, setRegularContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [treatmentProgressModalOpen, setTreatmentProgressModalOpen] = useState(false);
  const [selectedContractForProgress, setSelectedContractForProgress] = useState<Contract | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  const generateMockContracts = () => {
    const names = [
      { last: '山田', first: '太郎' },
      { last: '佐藤', first: '花子' },
      { last: '鈴木', first: '健太' },
      { last: '高橋', first: '美咲' },
      { last: '田中', first: '一郎' },
      { last: '渡辺', first: '由美' },
      { last: '伊藤', first: '隆' },
      { last: '中村', first: '愛' },
      { last: '小林', first: '誠' },
      { last: '加藤', first: '真由美' }
    ];
    
    const treatments = [
      'インプラント治療',
      '歯列矯正',
      'セラミック治療',
      'ホワイトニング',
      '審美歯科治療',
      '入れ歯作成',
      '根管治療',
      'ブリッジ治療'
    ];
    
    const paymentMethods = ['一括払い', '分割払い', '院内分割'];
    const paymentTypes = ['カード決済', 'キャリア決済', '口座振込', 'ローン'];
    const companies = ['オリコ', 'ジャックス', 'アプラス', 'セディナ', '-'];
    
    return Array.from({ length: 10 }, (_, i) => ({
      id: `contract-${i + 1}`,
      contractId: `${202507080001 + i}`,
      patient: {
        patientCode: `P${String(1000 + i).padStart(5, '0')}`,
        lastName: names[i].last,
        firstName: names[i].first
      },
      contractDate: new Date(2024, 10 - Math.floor(i / 3), 15 - i).toISOString(),
      totalAmount: [500000, 800000, 1200000, 300000, 600000, 450000, 900000, 750000, 550000, 1000000][i],
      serviceCompletionRate: [100, 80, 60, 40, 20, 0, 90, 70, 50, 30][i],
      serviceStatus: ['完了', 'in_progress', 'in_progress', 'in_progress', 'in_progress', '未入力', '完了', 'in_progress', 'in_progress', '未入力'][i],
      serviceType: treatments[i % treatments.length],
      paymentStatus: ['completed', 'in_progress', 'in_progress', 'delayed', 'in_progress', 'in_progress', 'completed', 'in_progress', 'delayed', 'in_progress'][i],
      paymentProgress: [100, 75, 50, 30, 60, 45, 100, 80, 25, 55][i],
      payment_method: paymentMethods[i % paymentMethods.length],
      payment_type: paymentTypes[i % paymentTypes.length],
      financeCompany: { name: companies[i % companies.length] },
      hasAlert: [false, false, false, true, false, true, false, false, true, false][i],
      alertType: [undefined, undefined, undefined, '支払い遅延', undefined, '役務未入力', undefined, undefined, '支払い遅延', undefined][i],
      status: 'active',
      isFullyCompleted: [true, false, false, false, false, false, true, false, false, false][i],
      shouldShowAlert: [false, false, false, true, false, true, false, false, true, false][i]
    }));
  };

  const mockContracts = React.useMemo(() => generateMockContracts(), []);

  useEffect(() => {
    // fetchContracts();
    // Use mock data instead
    setLoading(true);
    setTimeout(() => {
      setSpecialContracts(mockContracts);
      setRegularContracts(mockContracts);
      const alerts = mockContracts.filter(c => c.hasAlert || c.shouldShowAlert);
      setAlertCount(alerts.length);
      setLoading(false);
    }, 500);
  }, [activeTab, mockContracts]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const clinicId = localStorage.getItem('clinicId');
      const contractType = activeTab === 0 ? 'special' : 'regular';
      
      const response = await api.get(`/contracts?type=${contractType}&clinicId=${clinicId}`);
      console.log('Contracts API response:', response);
      
      // APIレスポンスが配列であることを確認
      const contractsData = Array.isArray(response.data) ? response.data : [];
      
      if (activeTab === 0) {
        setSpecialContracts(contractsData);
        // アラート数をカウント
        const alerts = contractsData.filter((c: Contract) => c.hasAlert || c.shouldShowAlert);
        setAlertCount(alerts.length);
      } else {
        setRegularContracts(contractsData);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      // エラー時は空配列をセット
      if (activeTab === 0) {
        setSpecialContracts([]);
        setAlertCount(0);
      } else {
        setRegularContracts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleViewDetail = (contract: Contract) => {
    setSelectedContract(contract);
    setDetailModalOpen(true);
  };

  const handleOpenTreatmentProgress = (contract: Contract) => {
    setSelectedContractForProgress(contract);
    setTreatmentProgressModalOpen(true);
  };

  const handleSaveTreatmentProgress = (days: number) => {
    console.log('Save treatment progress:', days, 'days for contract:', selectedContractForProgress?.contractId);
    // TODO: API call to save treatment progress
    setTreatmentProgressModalOpen(false);
  };

  const getRowStyle = (contract: Contract): React.CSSProperties => {
    // 院内分割で役務未入力または支払い遅延の場合
    if (activeTab === 0) {
      if (contract.serviceCompletionRate === 0 || contract.paymentStatus === 'delayed') {
        return { backgroundColor: '#E3F2FD' }; // 水色
      }
      // 完済かつ役務完了でグレーアウト
      if (contract.paymentStatus === 'completed' && contract.serviceCompletionRate >= 100) {
        return { backgroundColor: '#F5F5F5', opacity: 0.7 };
      }
    } else {
      // 通常決済で役務完了でグレーアウト
      if (contract.serviceCompletionRate >= 100) {
        return { backgroundColor: '#F5F5F5', opacity: 0.7 };
      }
    }
    return {};
  };

  const getServiceCellStyle = (contract: Contract): React.CSSProperties => {
    // 院内分割で役務未入力の場合
    if (activeTab === 0 && contract.serviceCompletionRate === 0) {
      return { backgroundColor: '#FFF59D' }; // 黄色
    }
    return {};
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'delayed':
      case 'defaulted':
        return 'error';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredContracts = (activeTab === 0 ? specialContracts : regularContracts).filter(contract => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      contract.contractId.toLowerCase().includes(searchLower) ||
      contract.patient.patientCode.toLowerCase().includes(searchLower) ||
      `${contract.patient.lastName}${contract.patient.firstName}`.toLowerCase().includes(searchLower)
    );
    
    const matchesDate = !dateFilter || format(new Date(contract.contractDate), 'yyyy-MM-dd') === dateFilter;
    const matchesPaymentMethod = !paymentMethodFilter || contract.payment_method === paymentMethodFilter;
    const matchesPaymentType = !paymentTypeFilter || contract.payment_type === paymentTypeFilter;
    const matchesCompany = !companyFilter || contract.financeCompany?.name === companyFilter;
    
    return matchesSearch && matchesDate && matchesPaymentMethod && matchesPaymentType && matchesCompany;
  });

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          契約一覧
        </Typography>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            label={
              <Badge badgeContent={alertCount} color="error">
                院内分割
              </Badge>
            } 
          />
          <Tab label="通常決済" />
        </Tabs>
      </Paper>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="検索（契約ID、患者ID、患者名）"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />
          <Button
            variant="outlined"
            startIcon={<DownloadIcon/>}
            onClick={() => {/* CSV出力処理 */}}
          >
            CSV出力
          </Button>
        </Box>
        
        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <DatePicker
              label="決済日/計上日"
              value={dateFilter ? new Date(dateFilter) : null}
              onChange={(newValue) => {
                setDateFilter(newValue ? format(newValue, 'yyyy-MM-dd') : '');
              }}
              slotProps={{
                textField: {
                  sx: { minWidth: 200 }
                }
              }}
            />
          </LocalizationProvider>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>決済方法</InputLabel>
            <Select
              value={paymentMethodFilter}
              label="決済方法"
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              <MenuItem value="">すべて</MenuItem>
              <MenuItem value="一括払い">一括払い</MenuItem>
              <MenuItem value="分割払い">分割払い</MenuItem>
              <MenuItem value="院内分割">院内分割</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>決済手段</InputLabel>
            <Select
              value={paymentTypeFilter}
              label="決済手段"
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
            >
              <MenuItem value="">すべて</MenuItem>
              <MenuItem value="カード決済">カード決済</MenuItem>
              <MenuItem value="キャリア決済">キャリア決済</MenuItem>
              <MenuItem value="口座振込">口座振込</MenuItem>
              <MenuItem value="ローン">ローン</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>決済会社</InputLabel>
            <Select
              value={companyFilter}
              label="決済会社"
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <MenuItem value="">すべて</MenuItem>
              <MenuItem value="オリコ">オリコ</MenuItem>
              <MenuItem value="ジャックス">ジャックス</MenuItem>
              <MenuItem value="アプラス">アプラス</MenuItem>
              <MenuItem value="セディナ">セディナ</MenuItem>
              <MenuItem value="-">-</MenuItem>
            </Select>
          </FormControl>
          
          {(dateFilter || paymentMethodFilter || paymentTypeFilter || companyFilter) && (
            <Button
              variant="outlined"
              onClick={() => {
                setDateFilter('');
                setPaymentMethodFilter('');
                setPaymentTypeFilter('');
                setCompanyFilter('');
              }}
            >
              フィルタをクリア
            </Button>
          )}
        </Box>
      </Box>

      {alertCount > 0 && activeTab === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {alertCount}件のアラートがあります。確認が必要です。
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>決済ID</TableCell>
                <TableCell>患者ID</TableCell>
                <TableCell>患者名</TableCell>
                <TableCell>治療名</TableCell>
                <TableCell align="right">金額</TableCell>
                <TableCell>決済方法</TableCell>
                <TableCell>決済手段</TableCell>
                <TableCell>決済会社</TableCell>
                <TableCell>支払進歩</TableCell>
                <TableCell>治療進歩</TableCell>
                <TableCell>決済日/計上日</TableCell>
                <TableCell align="center">詳細</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow
                  key={contract.id}
                  style={getRowStyle(contract)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {contract.hasAlert && (
                        <Tooltip title={contract.alertType}>
                          <Badge badgeContent=" " color="error" variant="dot">
                            <span />
                          </Badge>
                        </Tooltip>
                      )}
                      <Button
                        variant="text"
                        sx={{ 
                          minWidth: 'auto', 
                          p: 0, 
                          textTransform: 'none',
                          color: 'primary.main',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={() => handleViewDetail(contract)}
                      >
                        {contract.contractId}
                      </Button>
                    </Box>
                  </TableCell>
                  <TableCell>{contract.patient.patientCode}</TableCell>
                  <TableCell>
                    {contract.patient.lastName} {contract.patient.firstName}
                  </TableCell>
                  <TableCell>{contract.serviceType || '-'}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(contract.totalAmount)}
                  </TableCell>
                  <TableCell>{contract.payment_method}</TableCell>
                  <TableCell>{contract.payment_type}</TableCell>
                  <TableCell>{contract.financeCompany?.name || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {contract.paymentStatus === 'delayed' && (
                        <Typography color="error" component="span">
                          {contract.paymentProgress}%
                        </Typography>
                      )}
                      {contract.paymentStatus !== 'delayed' && (
                        <span>{contract.paymentProgress}%</span>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell style={getServiceCellStyle(contract)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {contract.serviceStatus === '未入力' ? (
                        <>
                          <Tooltip title="役務消化進捗が未入力です">
                            <WarningIcon color="warning" fontSize="small" />
                          </Tooltip>
                          <Button
                            variant="text"
                            sx={{ 
                              minWidth: 'auto', 
                              p: 0, 
                              textTransform: 'none',
                              color: 'warning.main',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => handleOpenTreatmentProgress(contract)}
                          >
                            未入力
                          </Button>
                        </>
                      ) : contract.serviceStatus === '完了' ? (
                        <Chip label="完了" color="success" size="small" />
                      ) : (
                        <>
                          {contract.paymentStatus === 'delayed' && activeTab === 0 && (
                            <Typography color="error" component="span">
                              {contract.serviceCompletionRate}%
                            </Typography>
                          )}
                          {!(contract.paymentStatus === 'delayed' && activeTab === 0) && (
                            <span>{contract.serviceCompletionRate}%</span>
                          )}
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {format(new Date(contract.contractDate), 'yyyy/MM/dd', { locale: ja })}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleViewDetail(contract)}
                    >
                      詳細
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedContract && (
        <ContractDetailModal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedContract(null);
          }}
          contractId={selectedContract.id}
          contractType={activeTab === 0 ? 'special' : 'regular'}
        />
      )}

      {/* Treatment Progress Modal */}
      <TreatmentProgressModal
        open={treatmentProgressModalOpen}
        onClose={() => setTreatmentProgressModalOpen(false)}
        onSave={handleSaveTreatmentProgress}
        contractId={selectedContractForProgress?.contractId || ''}
      />
      </Box>
    </DashboardLayout>
  );
};

// Treatment Progress Modal Component
interface TreatmentProgressModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (days: number) => void;
  contractId: string;
}

const TreatmentProgressModal: React.FC<TreatmentProgressModalProps> = ({
  open,
  onClose,
  onSave,
  contractId
}) => {
  const [treatmentDays, setTreatmentDays] = useState<number>(0);

  const handleSave = () => {
    onSave(treatmentDays);
    setTreatmentDays(0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            治療進歩
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            決済ID: {contractId}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="治療期間"
              value={treatmentDays}
              onChange={(e) => setTreatmentDays(parseInt(e.target.value) || 0)}
              InputProps={{
                endAdornment: <InputAdornment position="end">日</InputAdornment>,
              }}
              inputProps={{ 
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractList;