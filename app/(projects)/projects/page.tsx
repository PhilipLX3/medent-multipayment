'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/components/layouts/DashboardLayout';
import { ProtectedRoute } from '@/shared/components';
import { LeaseCompanyResultsDialog } from '@/contracts/_components';
import LeaseContractDetails from '../../(contracts)/contracts/lease-contract-details/page';
import { Box, Button, Card, CardContent, Chip, Collapse, Container, Divider, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, TextField, Typography, useMediaQuery, useTheme, CircularProgress } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { projectService } from '@/projects/_services';
import { Project } from '@/shared/types';
import toast from 'react-hot-toast';

type SortField = 'status' | 'leasingCompany' | 'itemName';

// Mobile Card Component for each project
interface ProjectCardProps {
  project: Project;
  onContractRequest: () => void;
  onViewContractDetails: (project: Project) => void;
  getStatusColor: (status: string) => string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onContractRequest, onViewContractDetails, getStatusColor }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {project.id}
            </Typography>
            <Chip
              label={project.status}
              color={getStatusColor(project.status) as any}
              size="small"
            />
          </Box>

          <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
            {project.itemName || project.treatment_name}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {project.clinicName || project.patient_name}
          </Typography>

          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {(project.amount || project.project_amount || 0).toLocaleString()}円
          </Typography>
        </Box>

        {/* Expand/Collapse Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }}
              />
            }
          >
            {expanded ? '閉じる' : 'もっと見る'}
          </Button>
        
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={onContractRequest}
          >
            契約依頼
          </Button>
        </Box>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                顧客ID
              </Typography>
              <Typography variant="body2">
                {project.customerId || project.patient_id}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                リース会社
              </Typography>
              <Typography variant="body2">
                {project.leasingCompany || project.finance_company_name}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                申込依頼日
              </Typography>
              <Typography variant="body2">
                {project.applicationRequestDate || project.application_date || '-'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                申込日
              </Typography>
              <Typography variant="body2">
                {project.applicationDate || project.application_date || '-'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                契約操作
              </Typography>
              <Typography variant="body2">
                {project.contractRequestDate || '-'}
              </Typography>
            </Box>

            {project.contractRequestDate && (
              <Box sx={{ gridColumn: '1 / -1', mt: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<VisibilityIcon />}
                  fullWidth
                  onClick={() => onViewContractDetails(project)}
                  sx={{
                    color: '#003366',
                    borderColor: '#003366',
                    '&:hover': {
                      backgroundColor: '#f0f4f8',
                      borderColor: '#002244',
                    }
                  }}
                >
                  契約詳細を見る
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default function ProjectsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<SortField>('status');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch projects from API on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Transform API project data to UI-compatible format
  const transformProject = (project: any): Project => {
    // Format the application request date
    const formatDate = (dateString: string | null): string => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0].replace(/-/g, '/');
    };

    return {
      // Required Project interface fields
      id: project.projectNumber || project.id?.toString() || '',
      project_number: project.projectNumber || '',
      patient_id: project.customerId || '',
      patient_name: project.clinicName || '',
      treatment_name: project.propertyName || '',
      project_amount: project.amount || 0,
      loan_type: 'standard', // Default value since not provided by API
      finance_company_name: '-',//TODO: Set back to dynamic value
      // finance_company_name: project.selectedFinanceCompany?.name || '',
      project_type: 'normal' as const, // Default value since not provided by API
      status: project.status?.nameJp || project.status?.name || '不明',
      application_date: formatDate(project.applicationRequestDate) || '',
      approval_date: formatDate(project.applicationDate) || null,
      completion_date: null, // This would be set when completed
      alert_message: null,
      created_at: project.applicationRequestDate || new Date().toISOString(),
      updated_at: project.applicationRequestDate || new Date().toISOString(),
      
      // Legacy/UI compatibility fields
      customerId: project.customerId || '',
      clinicName: project.clinicName || '',
      itemName: project.propertyName || '',
      amount: 30000000,//TODO: Set back to dynamic value
      // amount: project.amount || 0,
      leasingCompany: '-',//TODO: Set back to dynamic value
      // leasingCompany: project.selectedFinanceCompany?.name || '-',
      applicationRequestDate: formatDate(project.applicationRequestDate) || '',
      applicationDate: formatDate(project.applicationDate) || '',
      contractRequestDate: null, // This would be set when contract is requested
      isContractable: project.status?.nameJp === '審査OK' && !project.contractRequestDate,
    };
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Fetch all records with high limit for client-side pagination
      const filters: any = { 
        offset: 0,
        limit: 1000,
        isDescByCreatedAt: true // Default to show latest first
      };
      
      const response = await projectService.getProjects(filters);
      console.log('API Response:', response);
      
      // Handle the actual API response structure
      const responseData = response.data as any;
      
      if (responseData.data && Array.isArray(responseData.data)) {
        console.log('Raw project data:', responseData.data);
        console.log('Pagination info:', responseData.pagination);
        
        const transformedProjects = responseData.data.map(transformProject);
        console.log('Transformed projects:', transformedProjects);
        
        setProjects(transformedProjects);
        
        // Update pagination metadata
        if (responseData.pagination) {
          setTotalProjects(responseData.pagination.total);
          setTotalPages(responseData.pagination.totalPages);
        }
      } else {
        console.log('No data found or data is not an array:', responseData);
        setProjects([]);
        setTotalProjects(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('案件一覧の取得に失敗しました:', error);
      setProjects([]);
      setTotalProjects(0);
      setTotalPages(0);
      toast.error('案件データの取得に失敗しました。');
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

  // Reset to first page when search changes
  useEffect(() => {
    setPage(0);
  }, [searchQuery]);



  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProjectForDialog, setSelectedProjectForDialog] = useState<any | null>(null);
  const [contractDetailsOpen, setContractDetailsOpen] = useState(false);
  const [selectedContractForView, setSelectedContractForView] = useState<any | null>(null);

  // Sample lease company results
  const leaseCompanyResults = [
    {
      companyName: 'シャープファイナンス',
      screeningResult: 'OK' as const,
      rates: {
        fiveYear: '1.8%',
        sixYear: '1.6%',
        sevenYear: '1.3%'
      },
      maxAmount: 1200,
      additionalConditions: '動産保険有り\n再リース6ヶ月\n買取10%'
    },
    {
      companyName: 'リコーリース',
      screeningResult: 'OK' as const,
      rates: {
        fiveYear: '1.8%',
        sixYear: '1.6%',
        sevenYear: '1.3%'
      },
      maxAmount: 1500,
      additionalConditions: '動産保険有り\n再リース3ヶ月\n買取5%'
    },
    {
      companyName: '日医リース',
      screeningResult: 'NG' as const,
      rates: {
        fiveYear: '-',
        sixYear: '-',
        sevenYear: '-'
      },
      maxAmount: 0,
      additionalConditions: '-'
    },
    {
      companyName: 'MedEnt',
      screeningResult: 'OK' as const,
      rates: {
        fiveYear: '1.8%',
        sixYear: '1.6%',
        sevenYear: '1.3%'
      },
      maxAmount: 2000,
      additionalConditions: '動産保険無し\n請求条件付き\n経営コンサル付き'
    }
  ];

  // State to store the current lease results to display
  const [currentLeaseResults, setCurrentLeaseResults] = useState(leaseCompanyResults);

  const handleSelectCompany = (companyNames: string[], contractDataMap?: Record<string, any>) => {
    if (selectedProjectForDialog && companyNames.length > 0) {
      // Create a new array with the updated project
      const updatedProjects = projects.map(project => {
        if (project.id === selectedProjectForDialog.id) {
          // Create today's date in YYYY/MM/DD format for contract request date
          const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
          const joinedCompanyNames = companyNames.join(', ');

          // Update project with the selected company and mark as not contractable
          return {
            ...project,
            leasingCompany: joinedCompanyNames,
            isContractable: false,
            contractRequestDate: today,
            contractDataMap: contractDataMap || {},
          };
        }
        return project;
      });

      // Update the projects state with properly typed data
      setProjects(updatedProjects as typeof projects);
      console.log(`Selected companies: ${companyNames.join(', ')} for project: ${selectedProjectForDialog.id}`);
      console.log('Contract data:', contractDataMap);
    }

    // Close the dialog
    setDialogOpen(false);
  };

  const handleViewContractDetails = (project: any) => {
    // Get the contract data from the project
    const contractDataMap = project.contractDataMap || {};
    console.log('Project:', project);
    console.log('Contract Data Map:', contractDataMap);
    console.log('Leasing Company:', project.leasingCompany);

    // Get contract data for all selected companies
    const companies = project.leasingCompany?.split(', ') || [];
    const allContractsData: any[] = [];

    // Collect contract data for each selected company
    for (const company of companies) {
      if (contractDataMap[company]) {
        allContractsData.push(contractDataMap[company]);
        console.log('Found contract data for company:', company);
      }
    }
    // Convert project to contract format for the details modal
    const contractForView = {
      id: project.id,
      contract_number: project.project_number || project.id,
      patient_id: project.customerId || project.patient_id,
      patient_name: project.clinicName || project.patient_name,
      treatment_name: project.itemName || project.treatment_name,
      contract_amount: project.amount || project.project_amount || 0,
      loan_type: project.loan_type || 'standard',
      finance_company_name: project.leasingCompany || project.finance_company_name,
      contract_type: 'normal' as const,
      status: project.status,
      application_date: project.applicationRequestDate || project.application_date || '',
      approval_date: project.applicationDate || project.approval_date || null,
      completion_date: project.completion_date || null,
      alert_message: project.alert_message || null,
      created_at: project.created_at || new Date().toISOString(),
      updated_at: project.updated_at || new Date().toISOString(),

      // UI compatibility fields
      customerId: project.customerId || project.patient_id,
      corporateName: project.clinicName || project.patient_name,
      clinicName: project.clinicName || project.patient_name,
      propertyName: project.itemName || project.treatment_name,
      amount: project.amount || project.project_amount || 0,
      leaseCompany: project.leasingCompany || project.finance_company_name,
      contractRequestDate: project.contractRequestDate || null,
      inspectionConfirmationDate: null,
      contractDate: null,

      allContractsData: allContractsData,
      contractData: allContractsData.length > 0 ? allContractsData[0] : null,
    };

    setSelectedContractForView(contractForView);
    setContractDetailsOpen(true);
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      // Prepare the same filters used for the current view
      const filters: any = { 
        isDescByCreatedAt: true
      };
      
      // Add search parameters if search query exists
      if (searchQuery.trim()) {
        filters.clinicName = searchQuery.trim();
      }
      
      console.log('Exporting CSV with filters:', filters);
      toast('CSV エクスポートを開始しています...');
      
      // Call the export API
      const response = await projectService.export(filters);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
      link.download = `projects_${dateStr}_${timeStr}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV エクスポートが完了しました');
    } catch (error) {
      console.error('CSV Export failed:', error);
      toast.error('CSV エクスポートに失敗しました');
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '審査OK':
        return 'success';
      case '審査中':
        return 'warning';
      case '審査NG':
        return 'error';
      case '申込依頼済':
        return 'info';
      default:
        return 'default';
    }
  };

  // Client-side sorting and filtering like contracts page
  const sortedProjects = [...projects].sort((a, b) => {
    const aValue = a[orderBy] === null ? '' : String(a[orderBy]);
    const bValue = b[orderBy] === null ? '' : String(b[orderBy]);

    if (order === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const filteredProjects = sortedProjects.filter(project => {
    const query = searchQuery.toLowerCase();
    return (
      project.id.toLowerCase().includes(query) ||
      (project.customerId || '').toLowerCase().includes(query) ||
      (project.clinicName || '').toLowerCase().includes(query) ||
      (project.itemName || '').toLowerCase().includes(query)
    );
  });

  const paginatedProjects = filteredProjects.slice(
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
            </Box>
          </Paper>

          {/* Mobile Card View */}
          {isMobile ? (
            <Box>
              {loading ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    案件データを読み込み中...
                  </Typography>
                </Paper>
              ) : paginatedProjects.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    案件リストがありません
                  </Typography>
                </Paper>
              ) : (
                paginatedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onContractRequest={() => {
                      setSelectedProjectForDialog(project);
                      setCurrentLeaseResults(leaseCompanyResults);
                      setDialogOpen(true);
                    }}
                    onViewContractDetails={handleViewContractDetails}
                    getStatusColor={getStatusColor}
                  />
                ))
              )}

              <Paper sx={{ mt: 2 }}>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={filteredProjects.length}
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
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>案件No</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>顧客ID</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>法人名/医院名</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <TableSortLabel
                        active={orderBy === 'itemName'}
                        direction={orderBy === 'itemName' ? order : 'asc'}
                        onClick={() => handleSort('itemName')}
                        title={`${orderBy === 'itemName' && order === 'asc' ? '降順' : '昇順'}に並び替え`}
                        sx={{
                          fontWeight: orderBy === 'itemName' ? 'bold' : 'normal',
                          flexDirection: 'row-reverse',
                          '& .MuiTableSortLabel-icon': {
                            opacity: orderBy === 'itemName' ? 1 : 0.5,
                            marginRight: '4px',
                            marginLeft: 0
                          }
                        }}
                      >
                        物件名
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }} align="right">金額</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <TableSortLabel
                        active={orderBy === 'leasingCompany'}
                        direction={orderBy === 'leasingCompany' ? order : 'asc'}
                        onClick={() => handleSort('leasingCompany')}
                        title={`${orderBy === 'leasingCompany' && order === 'asc' ? '降順' : '昇順'}に並び替え`}
                        sx={{
                          fontWeight: orderBy === 'leasingCompany' ? 'bold' : 'normal',
                          flexDirection: 'row-reverse',
                          '& .MuiTableSortLabel-icon': {
                            opacity: orderBy === 'leasingCompany' ? 1 : 0.5,
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
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>申込依頼日</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>申込日</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '100px' }}>契約操作</TableCell>
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
                  ) : paginatedProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        案件リストがありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProjects.map((project) => (
                      <TableRow hover key={project.id}>
                        <TableCell>{project.id}</TableCell>
                        <TableCell>{project.customerId || project.patient_id}</TableCell>
                        <TableCell>{project.clinicName || project.patient_name}</TableCell>
                        <TableCell>{project.itemName || project.treatment_name}</TableCell>
                        <TableCell align="right">
                          {(project.amount || 0).toLocaleString()}円
                        </TableCell>
                        <TableCell>{project.leasingCompany || project.finance_company_name}</TableCell>
                        <TableCell>
                          <Chip
                            label={project.status}
                            color={getStatusColor(project.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{project.applicationRequestDate || project.application_date || '-'}</TableCell>
                        <TableCell>{project.applicationDate || project.application_date || '-'}</TableCell>
                        <TableCell align="center">
                          {project.contractRequestDate ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                {project.contractRequestDate}
                              </Typography>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleViewContractDetails(project)}
                                sx={{
                                  py: 0.25,
                                  px: 1,
                                  minWidth: '100px',
                                  fontSize: '0.7rem',
                                  whiteSpace: 'nowrap',
                                  color: '#003366',
                                  borderColor: '#003366',
                                  '&:hover': {
                                    backgroundColor: '#f0f4f8',
                                    borderColor: '#002244',
                                  }
                                }}
                              >
                                詳細
                              </Button>
                            </Box>
                          ) :(
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              sx={{ py: 0.5, minWidth: '80px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                              onClick={() => {
                                // Set the selected company for project
                                setSelectedProjectForDialog(project);
                                setCurrentLeaseResults(leaseCompanyResults);
                                setDialogOpen(true);
                              }}
                            >
                              契約依頼
                            </Button>
                          ) }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredProjects.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="表示件数:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}件`}
              />
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            {/* {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outlined"
                color="warning"
                onClick={() => router.push('/admin/data-management')}
                sx={{ mr: 'auto' }}
              >
                データ管理 (Dev)
              </Button>
            )} */}
            <Button
              variant="outlined"
              startIcon={exportLoading ? <CircularProgress size={16} /> : <FileDownloadIcon />}
              onClick={handleExportCSV}
              disabled={exportLoading}
            >
              {exportLoading ? 'エクスポート中...' : 'CSV出力'}
            </Button>
          </Box>

        </Box>
      </Container>

      {/* Lease Company Results Dialog */}
      <LeaseCompanyResultsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        projectNumber={selectedProjectForDialog?.id || ''}
        results={currentLeaseResults}
        onSelectCompany={handleSelectCompany}
      />

      {/* Contract Details Dialog */}
      <LeaseContractDetails
        open={contractDetailsOpen}
        onClose={() => {
          setContractDetailsOpen(false);
          setSelectedContractForView(null);
        }}
        contract={selectedContractForView}
      />
    </DashboardLayout>
    </ProtectedRoute>
  );
}