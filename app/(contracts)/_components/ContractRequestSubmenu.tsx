'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Divider,
  Modal,
  Paper,
  Typography,
  IconButton,
  Portal,
  ClickAwayListener,
  TextField,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface ContractRequestSubmenuProps {
  companyName: string;
  maxAmount: number;
  onClose: () => void;
  onConfirm: (contractData?: any) => void;
}

const ContractRequestSubmenu: React.FC<ContractRequestSubmenuProps> = ({
  companyName,
  maxAmount: initialMaxAmount,
  onClose,
  onConfirm
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [items, setItems] = useState([
    { name: 'ユニット', price: 3000000, quantity: 2 },
    { name: 'スキャナー', price: 5000000, quantity: 1 },
  ]);

  const maxAmount = 50000000; // 5000万円 (hardcoded)
  const [leasePeriod, setLeasePeriod] = useState('5');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Toggle dropdown
  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
    setDropdownOpen(!dropdownOpen);
  };

  // Handle Year selection
  const handleSelectYear = (year: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setLeasePeriod(year);
    setDropdownOpen(false);
  };

  const handleClickAway = () => {
    setDropdownOpen(false);
  };

  // Add new item row (max 10)
  const handleAddItem = () => {
    if (items.length < 10) {
      setItems([...items, { name: '', price: 0, quantity: 1 }]);
    }
  };

  // Remove item row
  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item field
  const handleUpdateItem = (index: number, field: 'name' | 'price' | 'quantity', value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  // Calculate totals
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  const difference = maxAmount > 0 ? maxAmount - total : 0;
  const isOverLimit = maxAmount > 0 && total > maxAmount;

  const handleOpenUploadModal = () => {
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleFileClick = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileTooltip = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    
    if (extension && previewableTypes.includes(extension)) {
      return '新しいタブでプレビュー';
    }
    return 'ダウンロードして表示';
  };

  const handleConfirmUpload = () => {
    setShowUploadModal(false);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        width: { xs: '95vw', sm: '90vw', md: 700, lg: 800 },
        maxWidth: '800px',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto', flex: 1 }}>
        <Typography variant="h6" align="center" fontWeight="500" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          {companyName}の契約依頼
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1, mb: 1, alignItems: 'center' }}>
            <Typography variant="body2" fontWeight="600" sx={{ flex: 2 }}>品目</Typography>
            <Typography variant="body2" fontWeight="600" sx={{ width: '140px', textAlign: 'center' }}>単価</Typography>
            <Typography variant="body2" fontWeight="600" sx={{ width: '80px', textAlign: 'center' }}>数量</Typography>
            <Typography variant="body2" fontWeight="600" sx={{ width: '140px', textAlign: 'right' }}>小計</Typography>
            <Box sx={{ width: '40px' }}></Box>
          </Box>

          {items.map((item, index) => (
            <Box key={index} sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              mb: 1.5,
              alignItems: { xs: 'stretch', sm: 'center' },
              p: { xs: 1.5, sm: 0 },
              bgcolor: { xs: 'rgba(0, 0, 0, 0.02)', sm: 'transparent' },
              borderRadius: { xs: 1, sm: 0 }
            }}>
              <TextField
                size="small"
                value={item.name}
                onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                placeholder="品目名"
                label={{ xs: '品目', sm: undefined }[0]}
                sx={{ flex: { xs: 1, sm: 2 } }}
              />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  type="number"
                  value={item.price}
                  onChange={(e) => handleUpdateItem(index, 'price', Number(e.target.value))}
                  label={{ xs: '単価', sm: undefined }[0]}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">円</InputAdornment>,
                  }}
                  sx={{ width: { xs: '100%', sm: '140px' }, flex: { xs: 1, sm: 'unset' } }}
                />
                <TextField
                  size="small"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleUpdateItem(index, 'quantity', Math.max(1, Number(e.target.value)))}
                  label={{ xs: '数量', sm: undefined }[0]}
                  inputProps={{ min: 1 }}
                  sx={{ width: { xs: '80px', sm: '80px' } }}
                />
              </Box>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1
              }}>
                <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">小計:</Typography>
                </Box>
                <Typography variant="body2" sx={{
                  width: { xs: 'auto', sm: '140px' },
                  textAlign: 'right',
                  fontWeight: '500',
                  flex: { xs: 1, sm: 'unset' }
                }}>
                  {(item.price * item.quantity).toLocaleString()}円
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length <= 1}
                  sx={{
                    width: '40px',
                    color: items.length <= 1 ? 'action.disabled' : 'error.main'
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}

          {items.length < 10 && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              sx={{
                textTransform: 'none',
                color: 'primary.main',
                mt: 1,
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              品目を追加
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Subtotal */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>小計</Typography>
          <Typography variant="body2" sx={{ minWidth: { xs: '80px', sm: '100px' }, textAlign: 'right', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            {subtotal.toLocaleString()}円
          </Typography>
        </Box>

        {/* Tax */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>消費税</Typography>
          <Typography variant="body2" sx={{ minWidth: { xs: '80px', sm: '100px' }, textAlign: 'right', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            {tax.toLocaleString()}円
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Max Amount Limit Field */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight="500" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>上限金額</Typography>
          <Typography variant="body2" sx={{ minWidth: { xs: '80px', sm: '100px' }, textAlign: 'right', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            {maxAmount > 0 ? `${maxAmount.toLocaleString()}円` : '-'}
          </Typography>
        </Box>

        {/* Total */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="600" sx={{ fontSize: { xs: '1rem', sm: '1.125rem' } }}>合計</Typography>
          <Typography
            variant="subtitle1"
            fontWeight="600"
            color={isOverLimit ? 'error.main' : '#2e7d32'}
            sx={{ minWidth: { xs: '80px', sm: '100px' }, textAlign: 'right', fontSize: { xs: '1rem', sm: '1.125rem' } }}
          >
            {total.toLocaleString()}円
          </Typography>
        </Box>

        {/* Difference */}
        {maxAmount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>差額</Typography>
            <Typography
              variant="body2"
              fontWeight="500"
              color={isOverLimit ? 'error.main' : 'success.main'}
              sx={{ minWidth: { xs: '80px', sm: '100px' }, textAlign: 'right', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {isOverLimit ? '-' : ''}{Math.abs(difference).toLocaleString()}円
            </Typography>
          </Box>
        )}
        {isOverLimit && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: { xs: 1, sm: 1.5 },
              p: { xs: 1.5, sm: 2 },
              mb: 2,
              borderRadius: 2,
              bgcolor: '#fef2f2',
              border: '1px solid #fecaca',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <ErrorOutlineIcon
              sx={{
                color: '#dc2626',
                fontSize: { xs: 20, sm: 24 },
                mt: 0.25
              }}
            />
            <Box>
              <Typography variant="body1" fontWeight="600" color="#b91c1c" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                すみません、合計金額が上限を超えています。
              </Typography>
              <Typography variant="body2" color="#b91c1c" sx={{ mt: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                上限金額以内になるように調整してください。
              </Typography>
            </Box>
          </Box>
        )}


        {/* Lease Period Dropdown */}
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="body2">リース期間</Typography>
            <Box
              ref={dropdownRef}
              onClick={handleToggleDropdown}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minWidth: 80,
                height: 36,
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: '4px',
                px: 2,
                py: 0.5,
                cursor: 'pointer',
                bgcolor: 'background.paper',
                '&:hover': {
                  borderColor: 'text.primary'
                },
                position: 'relative'
              }}
            >
              <Typography variant="body2" sx={{ textAlign: 'right' }}>
                {leasePeriod}年
              </Typography>
              <KeyboardArrowDownIcon
                fontSize="small"
                sx={{
                  ml: 1,
                  transition: 'transform 0.2s',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'none'
                }}
              />
            </Box>
          </Box>
        </ClickAwayListener>

        {dropdownOpen && (
          <Portal container={document.body}>
            <Box
              sx={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                zIndex: 9999,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 1,
                bgcolor: 'background.paper',
                mt: 0.5
              }}
            >
              {['5', '6', '7'].map((year) => (
                <Box
                  key={year}
                  onClick={handleSelectYear(year)}
                  sx={{
                    py: 1,
                    px: 2,
                    cursor: 'pointer',
                    bgcolor: leasePeriod === year ? 'rgba(25,118,210,0.08)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.04)'
                    }
                  }}
                >
                  <Typography variant="body2">{year}年</Typography>
                </Box>
              ))}
            </Box>
          </Portal>
        )}

        {/* Display uploaded files */}
        {uploadedFiles.length > 0 && (
          <Box sx={{ mb: 3, mt: 1 }}>
            <Typography variant="body2" fontWeight="500" sx={{ mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              添付ファイル ({uploadedFiles.length}件)
            </Typography>
            <Box
              sx={{
                maxHeight: 120,
                overflowY: 'auto',
                bgcolor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 1,
                p: { xs: 0.5, sm: 1 }
              }}
            >
              {uploadedFiles.map((file) => (
                <Box
                  key={file.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: { xs: 0.75, sm: 1 },
                    mb: 0.5,
                    bgcolor: 'white',
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.01)' }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 0.75, sm: 1 },
                      cursor: 'pointer',
                      flex: 1,
                      overflow: 'hidden'
                    }}
                    onClick={() => handleFileClick(file.file)}
                    title={getFileTooltip(file.name)}
                  >
                    <DescriptionIcon sx={{ color: '#1976d2', fontSize: { xs: 18, sm: 20 } }} />
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography variant="body2" noWrap sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{file.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{formatFileSize(file.size)}</Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(file.id)}
                    sx={{ color: 'error.main' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleOpenUploadModal}
            sx={{
              mb: 1.5,
              borderColor: '#e0e0e0',
              color: '#424242',
              textTransform: 'none',
              borderRadius: '6px',
              py: { xs: 0.75, sm: 1 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              '&:hover': {
                borderColor: '#bdbdbd',
                backgroundColor: 'rgba(0, 0, 0, 0.01)'
              }
            }}
          >
            見積もり書添付 {uploadedFiles.length > 0 && `(${uploadedFiles.length})`}
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={() => onConfirm({
              companyName,
              items,
              subtotal,
              tax,
              total,
              maxAmount,
              difference,
              leasePeriod,
              uploadedFiles: uploadedFiles.map(f => ({ name: f.name, size: f.size }))
            })}
            disabled={isOverLimit}
            sx={{
              backgroundColor: '#1976d2',
              color: 'white',
              textTransform: 'none',
              borderRadius: '6px',
              py: { xs: 0.75, sm: 1 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              '&:hover': {
                backgroundColor: '#1565c0',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
              },
              boxShadow: 'none'
            }}
          >
            契約依頼確定
          </Button>
        </Box>
      </Box>

      {/* File Upload */}
      <Modal
        open={showUploadModal}
        onClose={handleCloseUploadModal}
        aria-labelledby="file-upload-modal-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          sx={{
            width: { xs: '90vw', sm: 500 },
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: 2,
            outline: 'none',
            overflow: 'hidden'
          }}
        >
          <Box sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <Typography variant="h6" id="file-upload-modal-title" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              見積もり書添付
            </Typography>
            <IconButton onClick={handleCloseUploadModal} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: '2px dashed',
                borderColor: isDragging ? 'primary.main' : 'rgba(0, 0, 0, 0.2)',
                borderRadius: 2,
                p: { xs: 3, sm: 5 },
                textAlign: 'center',
                bgcolor: isDragging ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: isDragging ? 'primary.main' : 'rgba(0, 0, 0, 0.3)',
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'rgba(0, 0, 0, 0.3)' }} />
              <Typography variant="body1" sx={{ mt: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                ファイルをドラッグ&ドロップ
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                または
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  mt: 1,
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                  color: 'text.primary',
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                ファイルを選択
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                PDF, JPG, PNG, DOC (最大10MB)
              </Typography>
            </Box>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  添付ファイル ({uploadedFiles.length})
                </Typography>
                <Box sx={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  pr: 1,
                  mr: -1
                }}>
                  {uploadedFiles.map((file) => (
                    <Box
                      key={file.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: { xs: 1, sm: 1.5 },
                        mb: 1,
                        bgcolor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: { xs: 1, sm: 1.5 },
                          cursor: 'pointer',
                          flex: 1,
                          overflow: 'hidden'
                        }}
                        onClick={() => handleFileClick(file.file)}
                        title={getFileTooltip(file.name)}
                      >
                        <DescriptionIcon sx={{ color: '#1976d2', fontSize: { xs: 20, sm: 24 } }} />
                        <Box sx={{ overflow: 'hidden' }}>
                          <Typography variant="body2" noWrap sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{file.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{formatFileSize(file.size)}</Typography>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveFile(file.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'flex-end',
            gap: { xs: 1, sm: 2 },
            borderTop: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <Button
              variant="outlined"
              onClick={handleCloseUploadModal}
              sx={{
                borderColor: 'rgba(0, 0, 0, 0.23)',
                color: 'text.primary',
                textTransform: 'none',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  borderColor: 'rgba(0, 0, 0, 0.5)',
                  bgcolor: 'rgba(0, 0, 0, 0.01)'
                }
              }}
            >
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmUpload}
              disabled={uploadedFiles.length === 0}
              sx={{
                bgcolor: '#1976d2',
                color: 'white',
                textTransform: 'none',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  bgcolor: '#1565c0',
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(0, 0, 0, 0.12)',
                }
              }}
            >
              確定 {uploadedFiles.length > 0 && `(${uploadedFiles.length}件)`}
            </Button>
          </Box>
        </Paper>
      </Modal>
    </Paper>
  );
};

export default ContractRequestSubmenu;