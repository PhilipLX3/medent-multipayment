'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  TableSortLabel,
  TablePagination,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  FileDownload as FileDownloadIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { contractService } from '@/contracts/_services';
import { Contract } from '@/contracts/_types';

type SortField = 'contract_number' | 'patient_id' | 'patient_name' | 'contract_amount' | 'application_date' | 'approval_date' | 'completion_date';

const ContractListPage: React.FC = () => {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<SortField>('application_date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await contractService.getContracts();
      
      if (response.data && response.data.success) {
        setContracts(response.data.data?.contracts || []);
      } else {
        setContracts([]);
      }
    } catch (error) {
      console.error('契約一覧の取得に失敗しました:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    const isAsc = orderBy === field && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(field);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, contract: Contract) => {
    setAnchorEl(event.currentTarget);
    setSelectedContract(contract);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContract(null);
  };

  const handleViewDetails = () => {
    if (selectedContract) {
      router.push(`/contracts/${selectedContract.contract_number}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedContract) {
      router.push(`/contracts/${selectedContract.contract_number}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setContractToDelete(selectedContract);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (contractToDelete) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:7811/api/contracts/${contractToDelete.contract_number}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setContracts(contracts.filter(c => c.contract_number !== contractToDelete.contract_number));
        }
      } catch (error) {
        console.error('契約の削除に失敗しました:', error);
      }
    }
    setDeleteDialogOpen(false);
    setContractToDelete(null);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['契約ID', '患者ID', '患者名', '治療名', '金額', '決済方法', '信販会社', '契約種別', 'ステータス', '契約日', '承認日', '計上日'].join(','),
      ...filteredContracts.map(contract => [
        contract.contract_number,
        contract.patient_id,
        contract.patient_name,
        contract.treatment_name,
        contract.contract_amount,
        contract.loan_type,
        contract.finance_company_name,
        contract.contract_type === 'normal' ? '通常ローン' : '特別ローン',
        getStatusLabel(contract.status),
        contract.application_date,
        contract.approval_date || '',
        contract.completion_date || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `契約一覧_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'approved':
        return 'info';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '契約完了';
      case 'pending':
        return '審査中';
      case 'rejected':
        return '審査NG';
      case 'approved':
        return '承認済';
      case 'cancelled':
        return 'キャンセル';
      default:
        return status;
    }
  };

  const getContractTypeColor = (type: string) => {
    return type === 'special' ? 'secondary' : 'primary';
  };

  const sortedContracts = [...contracts].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const filteredContracts = sortedContracts.filter(contract => {
    const query = searchQuery.toLowerCase();
    return (
      contract.contract_number.toLowerCase().includes(query) ||
      contract.patient_id.toLowerCase().includes(query) ||
      contract.patient_name.toLowerCase().includes(query) ||
      contract.treatment_name.toLowerCase().includes(query) ||
      contract.finance_company_name.toLowerCase().includes(query)
    );
  });

  const paginatedContracts = filteredContracts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            契約一覧
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => router.push('/contracts/new')}
            >
              新規契約登録
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportCSV}
            >
              CSV出力
            </Button>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="検索（契約ID、患者ID、患者名）"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1, maxWidth: 400 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'contract_number'}
                    direction={orderBy === 'contract_number' ? order : 'asc'}
                    onClick={() => handleSort('contract_number')}
                  >
                    契約ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'patient_id'}
                    direction={orderBy === 'patient_id' ? order : 'asc'}
                    onClick={() => handleSort('patient_id')}
                  >
                    患者ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'patient_name'}
                    direction={orderBy === 'patient_name' ? order : 'asc'}
                    onClick={() => handleSort('patient_name')}
                  >
                    患者名
                  </TableSortLabel>
                </TableCell>
                <TableCell>治療名</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'contract_amount'}
                    direction={orderBy === 'contract_amount' ? order : 'asc'}
                    onClick={() => handleSort('contract_amount')}
                  >
                    金額
                  </TableSortLabel>
                </TableCell>
                <TableCell>決済方法</TableCell>
                <TableCell>信販会社</TableCell>
                <TableCell>契約種別</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'application_date'}
                    direction={orderBy === 'application_date' ? order : 'asc'}
                    onClick={() => handleSort('application_date')}
                  >
                    契約日
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'approval_date'}
                    direction={orderBy === 'approval_date' ? order : 'asc'}
                    onClick={() => handleSort('approval_date')}
                  >
                    承認日
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'completion_date'}
                    direction={orderBy === 'completion_date' ? order : 'asc'}
                    onClick={() => handleSort('completion_date')}
                  >
                    計上日
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} align="center">
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : paginatedContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} align="center">
                    契約情報がありません
                  </TableCell>
                </TableRow>
              ) : (
                paginatedContracts.map((contract) => (
                  <TableRow key={contract.contract_number} hover>
                    <TableCell>{contract.contract_number}</TableCell>
                    <TableCell>{contract.patient_id}</TableCell>
                    <TableCell>{contract.patient_name}</TableCell>
                    <TableCell>{contract.treatment_name}</TableCell>
                    <TableCell align="right">
                      ¥{contract.contract_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{contract.loan_type}</TableCell>
                    <TableCell>{contract.finance_company_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={contract.contract_type === 'normal' ? '通常ローン' : '特別ローン'}
                        color={getContractTypeColor(contract.contract_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(contract.status)}
                        color={getStatusColor(contract.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {contract.application_date ? format(new Date(contract.application_date), 'yyyy/MM/dd', { locale: ja }) : '-'}
                    </TableCell>
                    <TableCell>
                      {contract.approval_date ? format(new Date(contract.approval_date), 'yyyy/MM/dd', { locale: ja }) : '-'}
                    </TableCell>
                    <TableCell>
                      {contract.completion_date ? (
                        format(new Date(contract.completion_date), 'yyyy/MM/dd', { locale: ja })
                      ) : contract.status === 'completed' || contract.status === 'approved' ? (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            // 計上依頼の処理
                            console.log('計上依頼:', contract.contract_number);
                          }}
                        >
                          計上依頼
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, contract)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredContracts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="表示件数:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}件`}
          />
        </TableContainer>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleViewDetails}>
            <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
            詳細表示
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            編集
          </MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            削除
          </MenuItem>
        </Menu>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>契約の削除</DialogTitle>
          <DialogContent>
            <Typography>
              契約ID: {contractToDelete?.contract_number} を削除してもよろしいですか？
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              この操作は取り消すことができません。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              削除
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ContractListPage;