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
import { projectService } from '@/projects/_services';
import { Project } from '@/projects/_types';

type SortField = 'project_number' | 'patient_id' | 'patient_name' | 'project_amount' | 'application_date' | 'approval_date' | 'completion_date';

const ProjectListPage: React.FC = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<SortField>('application_date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectService.getProjects();
      
      if (response.data && response.data.success) {
        setProjects(response.data.data?.projects || []);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('案件一覧の取得に失敗しました:', error);
      setProjects([]);
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleViewDetails = () => {
    if (selectedProject) {
      router.push(`/projects/${selectedProject.project_number}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedProject) {
      router.push(`/projects/${selectedProject.project_number}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setProjectToDelete(selectedProject);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:7811/api/projects/${projectToDelete.project_number}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setProjects(projects.filter(c => c.project_number !== projectToDelete.project_number));
        }
      } catch (error) {
        console.error('案件の削除に失敗しました:', error);
      }
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['案件ID', '患者ID', '患者名', '治療名', '金額', '決済方法', '信販会社', '案件種別', 'ステータス', '申込日', '承認日', '完了日'].join(','),
      ...filteredProjects.map(project => [
        project.project_number,
        project.patient_id,
        project.patient_name,
        project.treatment_name,
        project.project_amount,
        project.loan_type,
        project.finance_company_name,
        project.project_type === 'normal' ? '通常ローン' : '特別ローン',
        getStatusLabel(project.status),
        project.application_date,
        project.approval_date || '',
        project.completion_date || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `案件一覧_${format(new Date(), 'yyyyMMdd')}.csv`;
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
        return '完了';
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

  const getProjectTypeColor = (type: string) => {
    return type === 'special' ? 'secondary' : 'primary';
  };

  const sortedProjects = [...projects].sort((a, b) => {
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

  const filteredProjects = sortedProjects.filter(project => {
    const query = searchQuery.toLowerCase();
    return (
      project.project_number.toLowerCase().includes(query) ||
      project.patient_id.toLowerCase().includes(query) ||
      project.patient_name.toLowerCase().includes(query) ||
      project.treatment_name.toLowerCase().includes(query) ||
      project.finance_company_name.toLowerCase().includes(query)
    );
  });

  const paginatedProjects = filteredProjects.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            案件一覧
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => router.push('/projects/new')}
            >
              新規案件登録
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
              placeholder="検索（案件ID、患者ID、患者名）"
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
                    active={orderBy === 'project_number'}
                    direction={orderBy === 'project_number' ? order : 'asc'}
                    onClick={() => handleSort('project_number')}
                  >
                    案件ID
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
                    active={orderBy === 'project_amount'}
                    direction={orderBy === 'project_amount' ? order : 'asc'}
                    onClick={() => handleSort('project_amount')}
                  >
                    金額
                  </TableSortLabel>
                </TableCell>
                <TableCell>決済方法</TableCell>
                <TableCell>信販会社</TableCell>
                <TableCell>案件種別</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'application_date'}
                    direction={orderBy === 'application_date' ? order : 'asc'}
                    onClick={() => handleSort('application_date')}
                  >
                    申込日
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
                    完了日
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
              ) : paginatedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} align="center">
                    案件情報がありません
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProjects.map((project) => (
                  <TableRow key={project.project_number} hover>
                    <TableCell>{project.project_number}</TableCell>
                    <TableCell>{project.patient_id}</TableCell>
                    <TableCell>{project.patient_name}</TableCell>
                    <TableCell>{project.treatment_name}</TableCell>
                    <TableCell align="right">
                      ¥{project.project_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{project.loan_type}</TableCell>
                    <TableCell>{project.finance_company_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={project.project_type === 'normal' ? '通常ローン' : '特別ローン'}
                        color={getProjectTypeColor(project.project_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(project.status)}
                        color={getStatusColor(project.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {project.application_date ? format(new Date(project.application_date), 'yyyy/MM/dd', { locale: ja }) : '-'}
                    </TableCell>
                    <TableCell>
                      {project.approval_date ? format(new Date(project.approval_date), 'yyyy/MM/dd', { locale: ja }) : '-'}
                    </TableCell>
                    <TableCell>
                      {project.completion_date ? (
                        format(new Date(project.completion_date), 'yyyy/MM/dd', { locale: ja })
                      ) : project.status === 'completed' || project.status === 'approved' ? (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            // 完了処理
                            console.log('完了処理:', project.project_number);
                          }}
                        >
                          完了処理
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, project)}
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
            count={filteredProjects.length}
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
          <DialogTitle>案件の削除</DialogTitle>
          <DialogContent>
            <Typography>
              案件ID: {projectToDelete?.project_number} を削除してもよろしいですか？
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

export default ProjectListPage;
