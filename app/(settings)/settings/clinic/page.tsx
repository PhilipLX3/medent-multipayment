'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DropResult,
  resetServerContext,
} from 'react-beautiful-dnd';
import { StrictModeDroppable } from '@/src/shared/components/StrictModeDroppable';
import { DashboardLayout } from '@/src/shared/components/layouts/DashboardLayout';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import api from '@/src/shared/services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface PaymentPlan {
  id: string;
  name: string;
  monthlyOptions: number[];
  interestRate: number;
  isActive: boolean;
}

interface FinanceCompany {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  priority: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// React 18 StrictMode fix for react-beautiful-dnd - Run once at component level
resetServerContext();

export default function DealerSettings() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // ローン会社設定
  const [financeCompanies, setFinanceCompanies] = useState<FinanceCompany[]>([]);
  const [editingCompany, setEditingCompany] = useState<FinanceCompany | null>(null);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  
  // 支払いプラン設定
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  
  // 基本設定
  const [clinicName, setClinicName] = useState('');
  const [defaultLandingPage, setDefaultLandingPage] = useState('new-payment');
  const [autoSendSms, setAutoSendSms] = useState(true);
  const [autoSendEmail, setAutoSendEmail] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // ローン会社設定を取得
      console.log('Loading finance companies...');
      const companiesRes = await api.get('/finance-companies/clinic')||{};
    console.log('Finance companies response:', companiesRes);
      console.log('Response data:', companiesRes.data);
      
      // レスポンスから配列を適切に取得
      let companies: FinanceCompany[] = [];
      
      try {
        // APIレスポンスの構造を確認
        const responseData = companiesRes.data;
        
        if (Array.isArray(responseData)) {
          companies = responseData;
        } else if (responseData && responseData.success && responseData.data) {
          // {success: true, data: {...}} 形式の場合
          if (Array.isArray(responseData.data)) {
            companies = responseData.data;
          } else if (responseData.data.companies && Array.isArray(responseData.data.companies)) {
            companies = responseData.data.companies;
          } else if (responseData.data.financeCompanies && Array.isArray(responseData.data.financeCompanies)) {
            companies = responseData.data.financeCompanies;
          } else {
            console.warn('Companies data is not in expected format, using empty array:', responseData.data);
            companies = [];
          }
        } else if (responseData && Array.isArray(responseData.data)) {
          companies = responseData.data;
        } else if (responseData && Array.isArray(responseData.companies)) {
          companies = responseData.companies;
        } else {
          console.warn('Companies is not an array, using empty array:', responseData);
          companies = [];
        }
      } catch (error) {
        console.error('Error parsing companies data:', error);
        companies = [];
      }
      
      console.log('Parsed companies:', companies);
      
      // companiesが配列であることを確認
      if (Array.isArray(companies) && companies.length > 0) {
        const sortedCompanies = companies.sort((a: FinanceCompany, b: FinanceCompany) => a.priority - b.priority);
        console.log('Sorted companies:', sortedCompanies);
        setFinanceCompanies(sortedCompanies);
      } else {
        console.log('No companies found or invalid format');
        setFinanceCompanies([]);
      }
      
      // 支払いプラン設定を取得
      try {
        const plansRes = await api.get('/payment-plans');
        const plansData = Array.isArray(plansRes.data) ? plansRes.data : [];
        setPaymentPlans(plansData);
      } catch (planError) {
        console.warn('Failed to load payment plans:', planError);
        setPaymentPlans([]);
      }
      
      // 基本設定を取得
      try {
        const settingsRes = await api.get('/clinic-settings');
        if (settingsRes.data) {
          setClinicName(settingsRes.data.clinicName || '');
          setDefaultLandingPage(settingsRes.data.defaultLandingPage || 'new-payment');
          setAutoSendSms(settingsRes.data.autoSendSms !== false);
          setAutoSendEmail(settingsRes.data.autoSendEmail !== false);
        }
      } catch (settingsError) {
        console.warn('Failed to load clinic settings:', settingsError);
        // デフォルト値を使用
        setClinicName('');
        setDefaultLandingPage('new-payment');
        setAutoSendSms(true);
        setAutoSendEmail(true);
      }
    } catch (error: any) {
      console.error('設定の読み込みに失敗しました:', error);
      console.error('Error details:', error.response?.data);
      setError(`設定の読み込みに失敗しました: ${error.message}`);
      // エラーでも空の配列をセット
      setFinanceCompanies([]);
      setPaymentPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // ローン会社のドラッグ&ドロップ
  const handleDragEnd = async (result: DropResult) => {
    console.log('Drag end:', result);
    if (!result.destination) {
      console.log('No destination');
      return;
    }

    const items = Array.from(financeCompanies);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      priority: index + 1,
    }));

    console.log('Updated items:', updatedItems);
    setFinanceCompanies(updatedItems);

    try {
      await api.put('/finance-companies/clinic/priority', {
        priorities: updatedItems.map(item => ({
          id: item.id,
          priority: item.priority,
          isActive: item.isActive,
        })),
      });
      setSuccess(true);
      // 成功メッセージを3秒後にクリア
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('優先順位の更新に失敗しました:', error);
      setError('優先順位の更新に失敗しました');
      loadSettings();
    }
  };

  // ローン会社の編集
  const handleEditCompany = (company: FinanceCompany) => {
    setEditingCompany(company);
    setCompanyDialogOpen(true);
  };

  const handleSaveCompany = async () => {
    if (!editingCompany) return;

    try {
      // 優先順位を変更した場合、他の会社の順位も調整
      let updatedCompanies = [...financeCompanies];
      const oldPriority = financeCompanies.find(c => c.id === editingCompany.id)?.priority || 1;
      const newPriority = editingCompany.priority;
      
      if (oldPriority !== newPriority) {
        // 編集中の会社を除外
        updatedCompanies = updatedCompanies.filter(c => c.id !== editingCompany.id);
        
        // 新しい優先順位の位置に挿入
        updatedCompanies.splice(newPriority - 1, 0, editingCompany);
        
        // 全体の優先順位を再計算
        updatedCompanies = updatedCompanies.map((company, index) => ({
          ...company,
          priority: index + 1
        }));
      } else {
        // 優先順位が変わらない場合は、isActiveのみ更新
        updatedCompanies = updatedCompanies.map(c => 
          c.id === editingCompany.id ? editingCompany : c
        );
      }
      
      setFinanceCompanies(updatedCompanies);
      
      // バックエンドに保存
      await api.put('/finance-companies/clinic/priority', {
        priorities: updatedCompanies.map(item => ({
          id: item.id,
          priority: item.priority,
          isActive: item.isActive,
        })),
      });
      
      setCompanyDialogOpen(false);
      setEditingCompany(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('ローン会社の更新に失敗しました:', error);
      setError('ローン会社の更新に失敗しました');
    }
  };

  // 支払いプランの追加・編集
  const handleAddPlan = () => {
    setEditingPlan({
      id: '',
      name: '',
      monthlyOptions: [3, 6, 12, 24, 36],
      interestRate: 0,
      isActive: true,
    });
    setPlanDialogOpen(true);
  };

  const handleEditPlan = (plan: PaymentPlan) => {
    setEditingPlan(plan);
    setPlanDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;

    try {
      console.log('Saving payment plan:', editingPlan);
      
      if (editingPlan.id) {
        const response = await api.put(`/payment-plans/${editingPlan.id}`, editingPlan);
        console.log('Update response:', response.data);
      } else {
        const response = await api.post('/payment-plans', editingPlan);
        console.log('Create response:', response.data);
      }
      setPlanDialogOpen(false);
      setEditingPlan(null);
      loadSettings();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('支払いプランの保存に失敗しました:', error);
      console.error('Error response:', error.response?.data);
      setError(`支払いプランの保存に失敗しました: ${error.response?.data?.error || error.message}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm('この支払いプランを削除してもよろしいですか？')) return;

    try {
      await api.delete(`/payment-plans/${planId}`);
      loadSettings();
      setSuccess(true);
    } catch (error) {
      console.error('支払いプランの削除に失敗しました:', error);
      setError('支払いプランの削除に失敗しました');
    }
  };

  // 基本設定の保存
  const handleSaveBasicSettings = async () => {
    try {
      await api.put('/clinic-settings', {
        clinicName,
        defaultLandingPage,
        autoSendSms,
        autoSendEmail,
      });
      setSuccess(true);
    } catch (error) {
      console.error('基本設定の保存に失敗しました:', error);
      setError('基本設定の保存に失敗しました');
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            医院設定
          </Typography>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="医院設定タブ">
            <Tab label="基本設定" />
            <Tab label="ローン会社設定" />
            <Tab label="支払いプラン設定" />
          </Tabs>
        </Box>

        {/* 基本設定タブ */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="医院名"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                variant="outlined"
                disabled
                helperText="医院名の変更は行政への届け出が必要なため、システムからは変更できません"
                FormHelperTextProps={{
                  sx: { marginLeft: 0 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>ログイン後のデフォルト画面</InputLabel>
                <Select
                  value={defaultLandingPage}
                  onChange={(e) => setDefaultLandingPage(e.target.value)}
                  label="ログイン後のデフォルト画面"
                >
                  <MenuItem value="dashboard">ダッシュボード</MenuItem>
                  <MenuItem value="new-payment">新規決済</MenuItem>
                  <MenuItem value="applications">申込一覧</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSendSms}
                    onChange={(e) => setAutoSendSms(e.target.checked)}
                  />
                }
                label="SMS自動送信を有効にする"
                sx={{ mt: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4.1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSendEmail}
                    onChange={(e) => setAutoSendEmail(e.target.checked)}
                  />
                }
                label="メール自動送信を有効にする"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveBasicSettings}
                disabled={loading}
              >
                基本設定を保存
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* ローン会社設定タブ */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            ローン会社優先順位設定
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ドラッグ＆ドロップで優先順位を変更できます。チェックを外すと該当のローン会社は審査対象から除外されます。
          </Typography>
          
          {loading ? (
            <Typography>読み込み中...</Typography>
          ) : financeCompanies.length === 0 ? (
            <Alert severity="warning">
              ローン会社が登録されていません。システム管理者にお問い合わせください。
            </Alert>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <StrictModeDroppable droppableId="finance-companies">
                {(provided) => (
                  <List {...provided.droppableProps} ref={provided.innerRef}>
                    {Array.isArray(financeCompanies) && financeCompanies.map((company, index) => (
                    <Draggable key={company.id} draggableId={company.id} index={index}>
                      {(provided: DraggableProvided) => (
                        <ListItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{
                            bgcolor: 'background.paper',
                            mb: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Box {...provided.dragHandleProps} sx={{ mr: 2 }}>
                            <DragIndicatorIcon />
                          </Box>
                          <ListItemText
                            primary={company.name}
                            secondary={`優先順位: ${company.priority} | ステータス: ${
                              company.isActive ? '有効' : '無効'
                            }`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" onClick={() => handleEditCompany(company)}>
                              <EditIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </StrictModeDroppable>
          </DragDropContext>
          )}
          
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={async () => {
                try {
                  await api.put('/finance-companies/clinic/priority', {
                    priorities: Array.isArray(financeCompanies) ? financeCompanies.map(item => ({
                      id: item.id,
                      priority: item.priority,
                    })) : [],
                  });
                  setSuccess(true);
                  setError('');
                } catch (error) {
                  console.error('優先順位の保存に失敗しました:', error);
                  setError('優先順位の保存に失敗しました');
                }
              }}
              disabled={loading}
            >
              優先順位を保存
            </Button>
          </Box>
        </TabPanel>

        {/* 支払いプラン設定タブ */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddPlan}
            >
              支払いプランを追加
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            {paymentPlans.map((plan) => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {plan.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      分割回数: {plan.monthlyOptions.join(', ')}回
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      金利: {plan.interestRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ステータス: {plan.isActive ? '有効' : '無効'}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={() => handleEditPlan(plan)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeletePlan(plan.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      {/* ローン会社編集ダイアログ */}
      <Dialog open={companyDialogOpen} onClose={() => setCompanyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ローン会社設定</DialogTitle>
        <DialogContent>
          {editingCompany && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="会社名"
                value={editingCompany.name}
                onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                sx={{ mb: 2 }}
                disabled
                helperText="会社名は変更できません"
              />
              <TextField
                fullWidth
                label="優先順位"
                type="number"
                value={editingCompany.priority}
                onChange={(e) => {
                  const newPriority = parseInt(e.target.value) || 1;
                  setEditingCompany({ ...editingCompany, priority: newPriority });
                }}
                sx={{ mb: 2 }}
                inputProps={{ min: 1, max: financeCompanies.length }}
                helperText="数字が小さいほど優先順位が高くなります"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editingCompany.isActive}
                    onChange={(e) => setEditingCompany({ ...editingCompany, isActive: e.target.checked })}
                  />
                }
                label="有効にする"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompanyDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleSaveCompany} color="primary" variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 支払いプラン編集ダイアログ */}
      <Dialog open={planDialogOpen} onClose={() => setPlanDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPlan?.id ? '支払いプラン編集' : '支払いプラン追加'}</DialogTitle>
        <DialogContent>
          {editingPlan && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="プラン名"
                value={editingPlan.name}
                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="分割回数（カンマ区切り）"
                value={editingPlan.monthlyOptions.join(', ')}
                onChange={(e) => {
                  const options = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                  setEditingPlan({ ...editingPlan, monthlyOptions: options });
                }}
                sx={{ mb: 2 }}
                helperText="例: 3, 6, 12, 24, 36"
              />
              <TextField
                fullWidth
                label="金利（%）"
                type="number"
                value={editingPlan.interestRate}
                onChange={(e) => setEditingPlan({ ...editingPlan, interestRate: parseFloat(e.target.value) || 0 })}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editingPlan.isActive}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                  />
                }
                label="有効にする"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleSavePlan} color="primary" variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 成功/エラーメッセージ */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success">
          設定を保存しました
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
      </Container>
    </DashboardLayout>
  );
}