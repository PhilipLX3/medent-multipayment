import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  Stack,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { Payment, PaymentStatus, PaymentStatusLabels, PaymentStatusColors } from '@/types/payment';

interface PaymentDetailModalProps {
  open: boolean;
  payment: Payment | null;
  onClose: () => void;
  onAccountingRequest?: (paymentId: string) => void;
}

// ステータス履歴のモックデータ（実際はAPIから取得）
const getStatusHistory = (payment: Payment) => {
  const history = [
    {
      status: PaymentStatus.PAYMENT_REQUESTED,
      date: payment.created_at,
      note: '決済依頼済み',
    }
  ];

  // 現在のステータスに基づいて履歴を生成
  if (payment.status !== PaymentStatus.PAYMENT_REQUESTED) {
    const baseDate = dayjs(payment.created_at);
    
    if ([PaymentStatus.REVIEWING, PaymentStatus.REVIEW_APPROVED, PaymentStatus.REVIEW_REJECTED].includes(payment.status)) {
      history.push({
        status: PaymentStatus.REVIEWING,
        date: baseDate.add(1, 'day').toISOString(),
        note: '審査開始',
      });
    }
    
    if (payment.status === PaymentStatus.REVIEW_APPROVED) {
      history.push({
        status: PaymentStatus.REVIEW_APPROVED,
        date: baseDate.add(2, 'day').toISOString(),
        note: '審査承認',
      });
    }
    
    if (payment.status === PaymentStatus.REVIEW_REJECTED) {
      history.push({
        status: PaymentStatus.REVIEW_REJECTED,
        date: baseDate.add(2, 'day').toISOString(),
        note: '審査NG（特別審査へ）',
      });
    }
    
    if (payment.status === PaymentStatus.PAYMENT_COMPLETED) {
      history.push({
        status: PaymentStatus.PAYMENT_COMPLETED,
        date: payment.completed_at || baseDate.add(3, 'day').toISOString(),
        note: '決済完了',
      });
    }
  }
  
  return history;
};

export default function PaymentDetailModal({
  open,
  payment,
  onClose,
  onAccountingRequest,
}: PaymentDetailModalProps) {
  if (!payment) return null;

  // 計上依頼ボタンの有効/無効を判定
  const isAccountingEnabled = 
    payment.status === PaymentStatus.REVIEW_APPROVED && 
    payment.payment_method === 'ローン';

  const handleAccountingRequest = () => {
    if (onAccountingRequest && isAccountingEnabled) {
      onAccountingRequest(payment.payment_id);
    }
  };

  const statusHistory = getStatusHistory(payment);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">決済詳細</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* 基本情報 */}
          <Grid size={12}>
            <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    一覧画面に記載ある情報を記載
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    下記項目を追加
                  </Typography>
                </Box>
                <Chip
                  label={PaymentStatusLabels[payment.status]}
                  sx={{
                    backgroundColor: PaymentStatusColors[payment.status].background,
                    color: PaymentStatusColors[payment.status].text,
                    fontWeight: 'medium',
                  }}
                />
              </Stack>
            </Box>
          </Grid>

          {/* 決済情報 */}
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              決済ID
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {payment.payment_id}
            </Typography>
          </Grid>
          
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              患者ID
            </Typography>
            <Typography variant="body1">
              {payment.patient_id || '-'}
            </Typography>
          </Grid>
          
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              患者名
            </Typography>
            <Typography variant="body1">
              {payment.patient_name}
            </Typography>
          </Grid>
          
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              治療名
            </Typography>
            <Typography variant="body1">
              {payment.treatment_name || '-'}
            </Typography>
          </Grid>
          
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              金額
            </Typography>
            <Typography variant="h6" color="primary">
              ¥{payment.amount.toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              決済方法
            </Typography>
            <Typography variant="body1">
              {payment.payment_method || 'ローン'}
            </Typography>
          </Grid>

          <Grid size={12}>
            <Divider />
          </Grid>

          {/* ローン会社情報 */}
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              決済会社
            </Typography>
            <Typography variant="body1">
              {payment.finance_company || '人参予定日'}
            </Typography>
          </Grid>
          
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              入金予定日
            </Typography>
            <Typography variant="body1">
              {payment.expected_deposit_date ? 
                dayjs(payment.expected_deposit_date).format('YYYY/MM/DD') : 
                '-'
              }
            </Typography>
          </Grid>

          <Grid size={12}>
            <Divider />
          </Grid>

          {/* ステータス履歴 */}
          <Grid size={12}>
            <Typography variant="subtitle2" gutterBottom>
              【ステータス履歴】
            </Typography>
            <Box sx={{ pl: 2 }}>
              {statusHistory.map((item, index) => (
                <Box key={index} sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>
                      {dayjs(item.date).format('YYYY/MM/DD')}
                    </Typography>
                    <Chip
                      label={PaymentStatusLabels[item.status]}
                      size="small"
                      sx={{
                        backgroundColor: PaymentStatusColors[item.status].background,
                        color: PaymentStatusColors[item.status].text,
                        height: 24,
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {item.note}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* 申込日・決済日 */}
          <Grid size={12}>
            <Divider />
          </Grid>
          
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              申込日
            </Typography>
            <Typography variant="body1">
              {dayjs(payment.created_at).format('YYYY/MM/DD')}
            </Typography>
          </Grid>
          
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary">
              決済日/計上日
            </Typography>
            <Typography variant="body1">
              {payment.completed_at ? 
                dayjs(payment.completed_at).format('YYYY/MM/DD') : 
                '-'
              }
            </Typography>
          </Grid>
        </Grid>

        {/* 注意事項 */}
        {payment.status === PaymentStatus.REVIEW_APPROVED && (
          <Alert severity="info" sx={{ mt: 3 }}>
            審査OKになりましたグレーアウト
            <br />
            ローン以外もグレーアウト
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
        >
          キャンセル
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AccountBalanceIcon />}
          onClick={handleAccountingRequest}
          disabled={!isAccountingEnabled}
        >
          計上依頼
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          sx={{ ml: 'auto' }}
        >
          ダウンロード
        </Button>
      </DialogActions>
    </Dialog>
  );
}