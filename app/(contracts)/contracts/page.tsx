'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/components/layouts/DashboardLayout';
import { ProtectedRoute } from '@/shared/components';
import ContractDetailsDialog from './lease-contract-details/page';
import { Box, Button, Card, CardContent, Chip, Container, Divider, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, TextField, Typography, useMediaQuery, useTheme, CircularProgress } from '@mui/material';
import { FileDownload as FileDownloadIcon, Search as SearchIcon } from '@mui/icons-material';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ja } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { contractService } from '@/contracts/_services';
import { Contract } from '@/shared/types';
import toast from 'react-hot-toast';

registerLocale('ja', ja);

type SortField = 'status' | 'leaseCompany' | 'propertyName';

// Card view for mobile
interface ContractCardProps {
  contract: Contract;
  onOpenDialog: (contract: Contract) => void;
  getStatusColor: (status: string) => string;
  isHighlighted?: boolean;
}

const ContractCard: React.FC<ContractCardProps> = ({ contract, onOpenDialog, getStatusColor, isHighlighted }) => {
  return (
    <Card
      sx={{
        mb: 2,
        backgroundColor: isHighlighted ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
        borderLeft: isHighlighted ? '4px solid' : 'none',
        borderLeftColor: isHighlighted ? 'primary.main' : 'transparent',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: isHighlighted ? 'primary.main' : 'inherit'
            }}
          >
            {contract.id}
          </Typography>
          <Chip
            label={contract.status}
            color={getStatusColor(contract.status) as any}
            size="small"
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              顧客ID
            </Typography>
            <Typography variant="body2">{contract.customerId || contract.patient_id}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              法人名/医院名
            </Typography>
            <Typography variant="body2">{contract.corporateName || contract.clinicName || contract.patient_name}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              物件名
            </Typography>
            <Typography variant="body2">{contract.propertyName || contract.treatment_name}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              金額
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {(contract.amount || contract.contract_amount || 0).toLocaleString()}円
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              リース会社
            </Typography>
            <Typography variant="body2">{contract.leaseCompany || contract.finance_company_name}</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                契約依頼日
              </Typography>
              <Typography variant="body2">{contract.contractRequestDate || '-'}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                契約日
              </Typography>
              <Typography variant="body2">{contract.contractDate || '-'}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={() => onOpenDialog(contract)}
          sx={{ mt: 2 }}
        >
          詳細
        </Button>
      </CardContent>
    </Card>
  );
};

export default function ContractsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<SortField>('status');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Date filter state
  const [contractDate, setContractDate] = useState<Date | null>(null);
  const [contractDateInput, setContractDateInput] = useState<string>('');
  const [showContractDatePicker, setShowContractDatePicker] = useState(false);
  const [leasePeriod, setLeasePeriod] = useState<string>('');
  const [leaseEndDate, setLeaseEndDate] = useState<Date | null>(null);
  const [leaseEndDateInput, setLeaseEndDateInput] = useState<string>('');
  const [showLeaseEndDatePicker, setShowLeaseEndDatePicker] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Utility function for date formatting
  const formatDateJapanese = (date: Date | null): string => {
    if (!date || isNaN(date.getTime())) return '';

    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // Validate that we got valid numbers
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return '';
      }

      const monthStr = String(month).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');

      return `${year}/${monthStr}/${dayStr}`;
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return '';
    }
  };

  // Fetch contracts from API
  useEffect(() => {
    fetchContracts();
  }, []);

  // Handle contractNo query parameter from URL
  useEffect(() => {
    const contractNo = searchParams?.get('contractNo');
    if (contractNo) {
      // Set the search query to the contract number
      setSearchQuery(contractNo);
      router.replace('/contracts', { scroll: false });
    }
  }, [searchParams, router]);

  // Handle clicks outside date pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showContractDatePicker && !(event.target as Element)?.closest('.react-datepicker')) {
        setShowContractDatePicker(false);
      }
      if (showLeaseEndDatePicker && !(event.target as Element)?.closest('.react-datepicker')) {
        setShowLeaseEndDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContractDatePicker, showLeaseEndDatePicker]);

  // Transform API contract data to UI-compatible format
  const transformContract = (apiContract: any): Contract => {
    return {
      // Map API fields to Contract interface
      id: apiContract.id?.toString() || '',
      contract_number: apiContract.contractNumber || '',
      patient_id: apiContract.customerId || '',
      patient_name: apiContract.customerName || '',
      treatment_name: apiContract.treatmentName || '',
      contract_amount: apiContract.contractAmount || 0,
      loan_type: 'standard',
      finance_company_name: '-',//TODO: Set back to dynamic value
      // finance_company_name: apiContract.financeCompany?.name || '',
      contract_type: apiContract.type?.value === 'SPECIAL' ? 'special' : 'normal',
      status: apiContract.status?.nameJp || apiContract.status?.name || '',
      application_date: '', // Not in API response
      approval_date: apiContract.approvedAt || null,
      completion_date: apiContract.contractConcludedAt || null,
      alert_message: null,
      created_at: '',
      updated_at: '',
      monthly_payment: 0,
      payment_count: 0,
      interest_rate: 0,
      service_completion_rate: 0,
      
      // UI compatibility fields
      customerId: apiContract.customerId || '',
      corporateName: apiContract.customerName || '',
      clinicName: apiContract.customerName || '',
      propertyName: apiContract.treatmentName || '',
      // amount: apiContract.contractAmount || 0,
      amount: 30000000,//TODO: Set back to dynamic value
      leaseCompany: '-',//TODO: Set back to dynamic value
      // leaseCompany: apiContract.financeCompany?.name || '',
      contractRequestDate: null,
      inspectionConfirmationDate: apiContract.approvedAt || null,
      contractDate: apiContract.contractConcludedAt || null,
    };
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await contractService.getContracts();
      // Handle the actual API response structure
      const apiData = response.data.data;
      const apiContracts = Array.isArray(apiData) ? apiData : [];
      const transformedContracts = apiContracts.map(transformContract);
      setContracts(transformedContracts);
    } catch (error) {
      console.error('契約一覧の取得に失敗しました:', error);
      setContracts([]);
      toast.error('契約データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedContract(null);
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

  const handleExportCSV = async () => {
    try {
      // Prepare the same filters used for the current view
      const filters: any = {};
      
      // Add search parameters if search query exists
      if (searchQuery.trim()) {
        filters.patient_name = searchQuery.trim();
      }
      
      // Add date filters if they exist
      if (contractDate) {
        filters.from_date = contractDate.toISOString().split('T')[0];
      }
      if (leaseEndDate) {
        filters.to_date = leaseEndDate.toISOString().split('T')[0];
      }
      
      console.log('Exporting contracts CSV with filters:', filters);
      toast('CSV エクスポートを開始しています...');
      
      // Call the export API
      const response = await contractService.export(filters);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
      link.download = `contracts_${dateStr}_${timeStr}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV エクスポートが完了しました');
    } catch (error) {
      console.error('CSV Export failed:', error);
      toast.error('CSV エクスポートに失敗しました');
      
      // Fallback to client-side export if API fails
      const csvHeaders = [
        '案件No',
        '顧客ID',
        '法人名/医院名',
        '物件名',
        '金額',
        'リース会社',
        'ステータス',
        '契約依頼日',
        '検収確認依頼日',
        '契約日'
      ];

      const csvRows = contracts.map(contract => [
        contract.id,
        contract.customerId,
        contract.corporateName || contract.clinicName,
        contract.propertyName,
        contract.amount,
        contract.leaseCompany,
        contract.status,
        contract.contractRequestDate || '-',
        contract.inspectionConfirmationDate || '-',
        contract.contractDate || '-'
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      link.download = `契約一覧_${today}.csv`;
      link.click();
      
      toast.success('クライアント側でCSVエクスポートを完了しました');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '契約完了':
        return 'success';
      case '契約待ち':
        return 'info';
      case '納品待ち':
        return 'warning';
      case '検収待ち':
        return 'warning';
      case 'キャンセル':
        return 'error';
      default:
        return 'default';
    }
  };

  const sortedContracts = [...contracts].sort((a, b) => {
    const aValue = a[orderBy] === null ? '' : String(a[orderBy]);
    const bValue = b[orderBy] === null ? '' : String(b[orderBy]);

    if (order === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const filteredContracts = sortedContracts.filter(contract => {
    const query = searchQuery.toLowerCase();
    return (
      contract.id.toLowerCase().includes(query) ||
      (contract.customerId || '').toLowerCase().includes(query) ||
      (contract.clinicName || '').toLowerCase().includes(query) ||
      (contract.propertyName || '').toLowerCase().includes(query)
    );
  });

  const paginatedContracts = filteredContracts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Container maxWidth="xl">
          <Box sx={{ py: 3 }}>
            {/* Search and Filters */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{
                display: 'flex',
                gap: 2,
                alignItems: isMobile ? 'stretch' : 'center',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                {/* Search Box */}
                <TextField
                  placeholder="検索"
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ width: isMobile ? '100%' : 300 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {/* Filter Inputs */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  flexDirection: isMobile ? 'column' : 'row',
                  width: isMobile ? '100%' : 'auto'
                }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', width: isMobile ? '100%' : 'auto' }}>
                    契約日
                  </Typography>
                  <div className="relative" style={{ width: isMobile ? '100%' : 'auto' }}>
                    <input
                      type="text"
                      value={contractDateInput}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^\d]/g, '');

                        // Real-time validation and correction as user types
                        if (value.length >= 4) {
                          // Check and correct year
                          let year = parseInt(value.slice(0, 4));
                          const currentYear = new Date().getFullYear();
                          if (year < 1900) {
                            year = 1900;
                            value = '1900' + value.slice(4);
                          } else if (year > currentYear + 10) {
                            year = currentYear + 10;
                            value = (currentYear + 10).toString() + value.slice(4);
                          }
                        }

                        if (value.length >= 6) {
                          // Check and correct month
                          let month = parseInt(value.slice(4, 6));
                          if (month > 12) {
                            month = 12;
                            value = value.slice(0, 4) + '12' + value.slice(6);
                          } else if (month < 1 && value.slice(4, 6) === '00') {
                            month = 1;
                            value = value.slice(0, 4) + '01' + value.slice(6);
                          }
                        }

                        if (value.length >= 8) {
                          // Check and correct day
                          let day = parseInt(value.slice(6, 8));
                          if (day > 31) {
                            day = 31;
                            value = value.slice(0, 6) + '31' + value.slice(8);
                          } else if (day < 1 && value.slice(6, 8) === '00') {
                            day = 1;
                            value = value.slice(0, 6) + '01' + value.slice(8);
                          }

                          // Further validation for month-specific day limits
                          const year = parseInt(value.slice(0, 4));
                          const month = parseInt(value.slice(4, 6));

                          if (month === 2) {
                            // February - check for leap year
                            const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
                            const maxDay = isLeapYear ? 29 : 28;
                            if (day > maxDay) {
                              day = maxDay;
                              value = value.slice(0, 6) + String(maxDay).padStart(2, '0');
                            }
                          } else if ([4, 6, 9, 11].includes(month)) {
                            // April, June, September, November - 30 days
                            if (day > 30) {
                              day = 30;
                              value = value.slice(0, 6) + '30';
                            }
                          }
                        }

                        // Add slashes for formatting
                        if (value.length >= 5) {
                          value = value.slice(0, 4) + '/' + value.slice(4);
                        }
                        if (value.length >= 8) {
                          value = value.slice(0, 7) + '/' + value.slice(7, 9);
                        }

                        setContractDateInput(value);

                        // Set the date object if complete and valid
                        if (value.length === 10) {
                          const [year, month, day] = value.split('/').map(Number);
                          const parsedDate = new Date(year, month - 1, day);

                          // Double-check that the date is valid
                          if (parsedDate.getFullYear() === year &&
                            parsedDate.getMonth() === month - 1 &&
                            parsedDate.getDate() === day) {
                            setContractDate(parsedDate);
                          } else {
                            setContractDate(null);
                          }
                        } else {
                          setContractDate(null);
                        }
                      }}
                      placeholder="YYYY/MM/DD"
                      maxLength={10}
                      className={`border border-gray-300 rounded px-3 py-1.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isMobile ? 'w-full' : 'w-40'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowContractDatePicker(true)}
                      className="absolute inset-y-0 right-0 mr-2 flex items-center"
                    >
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>

                    {showContractDatePicker && (
                      <div className="absolute top-full left-0 z-50 mt-1">
                        <DatePicker
                          selected={contractDate}
                          onChange={(date: Date | null) => {
                            setContractDate(date);
                            if (date) {
                              setContractDateInput(formatDateJapanese(date));
                            }
                            setShowContractDatePicker(false);
                          }}
                          locale="ja"
                          dateFormat="yyyy/MM/dd"
                          showYearDropdown
                          showMonthDropdown
                          dropdownMode="select"
                          yearDropdownItemNumber={50}
                          maxDate={new Date(new Date().getFullYear() + 10, 11, 31)}
                          minDate={new Date(1900, 0, 1)}
                          openToDate={contractDate || new Date()}
                          inline
                        />
                      </div>
                    )}
                  </div>
                </Box>

                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  flexDirection: isMobile ? 'column' : 'row',
                  width: isMobile ? '100%' : 'auto'
                }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', width: isMobile ? '100%' : 'auto' }}>
                    リース期間
                  </Typography>
                  <TextField
                    variant="outlined"
                    size="small"
                    value={leasePeriod || ''}
                    onChange={(e) => setLeasePeriod(e.target.value as any)}
                    sx={{ width: isMobile ? '100%' : 160 }}
                  />
                </Box>

                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  flexDirection: isMobile ? 'column' : 'row',
                  width: isMobile ? '100%' : 'auto'
                }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', width: isMobile ? '100%' : 'auto' }}>
                    リース期間終了予定日
                  </Typography>
                  <div className="relative" style={{ width: isMobile ? '100%' : 'auto' }}>
                    <input
                      type="text"
                      value={leaseEndDateInput}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^\d]/g, '');

                        // Real-time validation and correction as user types
                        if (value.length >= 4) {
                          // Check and correct year
                          let year = parseInt(value.slice(0, 4));
                          const currentYear = new Date().getFullYear();
                          if (year < 1900) {
                            year = 1900;
                            value = '1900' + value.slice(4);
                          } else if (year > currentYear + 50) {
                            year = currentYear + 50;
                            value = (currentYear + 50).toString() + value.slice(4);
                          }
                        }

                        if (value.length >= 6) {
                          // Check and correct month
                          let month = parseInt(value.slice(4, 6));
                          if (month > 12) {
                            month = 12;
                            value = value.slice(0, 4) + '12' + value.slice(6);
                          } else if (month < 1 && value.slice(4, 6) === '00') {
                            month = 1;
                            value = value.slice(0, 4) + '01' + value.slice(6);
                          }
                        }

                        if (value.length >= 8) {
                          // Check and correct day
                          let day = parseInt(value.slice(6, 8));
                          if (day > 31) {
                            day = 31;
                            value = value.slice(0, 6) + '31' + value.slice(8);
                          } else if (day < 1 && value.slice(6, 8) === '00') {
                            day = 1;
                            value = value.slice(0, 6) + '01' + value.slice(8);
                          }

                          // Further validation for month-specific day limits
                          const year = parseInt(value.slice(0, 4));
                          const month = parseInt(value.slice(4, 6));

                          if (month === 2) {
                            // February - check for leap year
                            const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
                            const maxDay = isLeapYear ? 29 : 28;
                            if (day > maxDay) {
                              day = maxDay;
                              value = value.slice(0, 6) + String(maxDay).padStart(2, '0');
                            }
                          } else if ([4, 6, 9, 11].includes(month)) {
                            // April, June, September, November - 30 days
                            if (day > 30) {
                              day = 30;
                              value = value.slice(0, 6) + '30';
                            }
                          }
                        }

                        // Add slashes for formatting
                        if (value.length >= 5) {
                          value = value.slice(0, 4) + '/' + value.slice(4);
                        }
                        if (value.length >= 8) {
                          value = value.slice(0, 7) + '/' + value.slice(7, 9);
                        }

                        setLeaseEndDateInput(value);

                        // Set the date object if complete and valid
                        if (value.length === 10) {
                          const [year, month, day] = value.split('/').map(Number);
                          const parsedDate = new Date(year, month - 1, day);

                          // Double-check that the date is valid
                          if (parsedDate.getFullYear() === year &&
                            parsedDate.getMonth() === month - 1 &&
                            parsedDate.getDate() === day) {
                            setLeaseEndDate(parsedDate);
                          } else {
                            setLeaseEndDate(null);
                          }
                        } else {
                          setLeaseEndDate(null);
                        }
                      }}
                      placeholder="YYYY/MM/DD"
                      maxLength={10}
                      className={`border border-gray-300 rounded px-3 py-1.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isMobile ? 'w-full' : 'w-40'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLeaseEndDatePicker(true)}
                      className="absolute inset-y-0 right-0 mr-2 flex items-center"
                    >
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>

                    {showLeaseEndDatePicker && (
                      <div className="absolute top-full left-0 z-50 mt-1">
                        <DatePicker
                          selected={leaseEndDate}
                          onChange={(date: Date | null) => {
                            setLeaseEndDate(date);
                            if (date) {
                              setLeaseEndDateInput(formatDateJapanese(date));
                            }
                            setShowLeaseEndDatePicker(false);
                          }}
                          locale="ja"
                          dateFormat="yyyy/MM/dd"
                          showYearDropdown
                          showMonthDropdown
                          dropdownMode="select"
                          yearDropdownItemNumber={50}
                          maxDate={new Date(new Date().getFullYear() + 50, 11, 31)}
                          minDate={new Date(1900, 0, 1)}
                          openToDate={leaseEndDate || new Date()}
                          inline
                        />
                      </div>
                    )}
                  </div>
                </Box>
              </Box>
            </Paper>

            {/* Mobile Card View */}
            {isMobile ? (
              <Box>
                {loading ? (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      契約データを読み込み中...
                    </Typography>
                  </Paper>
                ) : paginatedContracts.length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>契約情報がありません</Typography>
                  </Paper>
                ) : (
                  paginatedContracts.map((contract) => {
                    const isHighlighted = !!(searchQuery && contract.id.toLowerCase() === searchQuery.toLowerCase());
                    return (
                      <ContractCard
                        key={contract.id}
                        contract={contract}
                        onOpenDialog={handleOpenDialog}
                        getStatusColor={getStatusColor}
                        isHighlighted={isHighlighted}
                      />
                    );
                  })
                )}
                {/* Pagination for mobile */}
                <Paper sx={{ mt: 2 }}>
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
                </Paper>
              </Box>
            ) : (
              /* Desktop Table View */
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>案件No</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>顧客ID</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>法人名/医院名</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <TableSortLabel
                          active={orderBy === 'propertyName'}
                          direction={orderBy === 'propertyName' ? order : 'asc'}
                          onClick={() => handleSort('propertyName')}
                          title={`${orderBy === 'propertyName' && order === 'asc' ? '降順' : '昇順'}に並び替え`}
                          sx={{
                            fontWeight: orderBy === 'propertyName' ? 'bold' : 'normal',
                            flexDirection: 'row-reverse',
                            '& .MuiTableSortLabel-icon': {
                              opacity: orderBy === 'propertyName' ? 1 : 0.5,
                              marginRight: '4px',
                              marginLeft: 0
                            }
                          }}
                        >
                          物件名
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '120px' }} align="right">金額</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <TableSortLabel
                          active={orderBy === 'leaseCompany'}
                          direction={orderBy === 'leaseCompany' ? order : 'asc'}
                          onClick={() => handleSort('leaseCompany')}
                          title={`${orderBy === 'leaseCompany' && order === 'asc' ? '降順' : '昇順'}に並び替え`}
                          sx={{
                            fontWeight: orderBy === 'leaseCompany' ? 'bold' : 'normal',
                            flexDirection: 'row-reverse',
                            '& .MuiTableSortLabel-icon': {
                              opacity: orderBy === 'leaseCompany' ? 1 : 0.5,
                              marginRight: '4px',
                              marginLeft: 0
                            }
                          }}
                        >
                          リース会社
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <TableSortLabel
                          active={orderBy === 'status'}
                          direction={orderBy === 'status' ? order : 'asc'}
                          onClick={() => handleSort('status')}
                          title={`${orderBy === 'status' && order === 'asc' ? '降順' : '昇順'}に並び替え`}
                          sx={{
                            fontWeight: orderBy === 'status' ? 'bold' : 'normal',
                            flexDirection: 'row-reverse',
                            '& .MuiTableSortLabel-icon': {
                              opacity: orderBy === 'status' ? 1 : 0.5,
                              marginRight: '4px',
                              marginLeft: 0
                            }
                          }}
                        >
                          ステータス
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>契約依頼日</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>検収確認依頼日</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>契約日</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }} align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={11} align="center">
                          <CircularProgress size={20} />
                          <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                            読み込み中...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : paginatedContracts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} align="center">
                          契約情報がありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedContracts.map((contract) => {
                        const isHighlighted = !!(searchQuery && contract.id.toLowerCase() === searchQuery.toLowerCase());
                        return (
                          <TableRow
                            key={contract.id}
                            hover
                            sx={{
                              backgroundColor: isHighlighted ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                              '&:hover': {
                                backgroundColor: isHighlighted ? 'rgba(25, 118, 210, 0.12)' : undefined,
                              }
                            }}
                          >
                            <TableCell
                              sx={{
                                fontWeight: isHighlighted ? 'bold' : 'normal',
                                color: isHighlighted ? 'primary.main' : 'inherit'
                              }}
                            >
                              {contract.id}
                            </TableCell>
                            <TableCell>{contract.customerId}</TableCell>
                          <TableCell>{contract.corporateName || contract.clinicName}</TableCell>
                          <TableCell>{contract.propertyName}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: '120px' }}>
                            {(contract.amount || contract.contract_amount || 0).toLocaleString()}円
                          </TableCell>
                          <TableCell>{contract.leaseCompany}</TableCell>
                          <TableCell>
                            <Chip
                              label={contract.status}
                              color={getStatusColor(contract.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{contract.contractRequestDate || '-'}</TableCell>
                          <TableCell>{contract.inspectionConfirmationDate || '-'}</TableCell>
                          <TableCell>{contract.contractDate || '-'}</TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleOpenDialog(contract)}
                              sx={{
                                py: 0.5,
                                minWidth: '60px',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              詳細
                            </Button>
                          </TableCell>
                        </TableRow>
                        );
                      })
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
            )}

            <Box sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-end',
              mt: 2,
              width: isMobile ? '100%' : 'auto'
            }}>
              {/* {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => router.push('/admin/contract-data-management')}
                  sx={{ mr: 'auto' }}
                >
                  契約データ管理 (Dev)
                </Button>
              )} */}
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportCSV}
                fullWidth={isMobile}
              >
                CSV出力
              </Button>
            </Box>

          </Box>
        </Container>

        {/* Contract Details Dialog */}
        <ContractDetailsDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          contract={selectedContract}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}


