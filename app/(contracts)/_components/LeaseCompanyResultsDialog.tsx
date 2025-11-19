'use client';

import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Chip, ClickAwayListener, Dialog, DialogContent, Divider, IconButton, Modal, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import ContractRequestSubmenu from './ContractRequestSubmenu';

type LeaseCompanyResult = {
  companyName: string;
  screeningResult: 'OK' | 'NG';
  rates: {
    fiveYear: string;
    sixYear: string;
    sevenYear: string;
  };
  maxAmount: number;
  additionalConditions: string;
};

interface LeaseCompanyResultsDialogProps {
  open: boolean;
  onClose: () => void;
  projectNumber: string;
  results: LeaseCompanyResult[];
  onSelectCompany: (companyNames: string[], contractDataMap?: Record<string, any>) => void;
}

// Card view for mobile
interface CompanyCardProps {
  company: LeaseCompanyResult;
  isSelected: boolean;
  onToggleActive: (event: React.MouseEvent<HTMLElement>) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, isSelected, onToggleActive }) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Company Name and Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            {company.companyName}
          </Typography>
          <Chip
            label={`審査${company.screeningResult}`}
            color={company.screeningResult === 'OK' ? 'success' : 'error'}
            size="small"
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Lease Rates */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            リース料率/期間
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2">5年: {company.rates.fiveYear}</Typography>
            <Typography variant="body2">6年: {company.rates.sixYear}</Typography>
            <Typography variant="body2">7年: {company.rates.sevenYear}</Typography>
          </Box>
        </Box>

        {/* Max Amount */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            上限金額
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {company.maxAmount > 0 ? `${company.maxAmount.toLocaleString()}万円` : '-'}
          </Typography>
        </Box>

        {/* Additional Conditions */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            付帯条件
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {company.additionalConditions}
          </Typography>
        </Box>

        {/* Action Button */}
        {company.screeningResult === 'OK' && (
          <Button
            variant="contained"
            fullWidth
            onClick={onToggleActive}
            sx={{
              backgroundColor: isSelected ? '#cccccc' : '#003366',
              color: 'white',
              '&:hover': {
                backgroundColor: isSelected ? '#bbbbbb' : '#002244',
              },
            }}
          >
            {isSelected ? '契約依頼済' : '契約依頼'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const LeaseCompanyResultsDialog: React.FC<LeaseCompanyResultsDialogProps> = ({
  open,
  onClose,
  results,
  onSelectCompany,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [activeSubmenuCompany, setActiveSubmenuCompany] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contractDataMap, setContractDataMap] = useState<Record<string, any>>({});

  const handleToggleActive = (event: React.MouseEvent<HTMLElement>, companyName: string) => {
    if (selectedCompanies.includes(companyName)) {
      // If already selected set to inactive
      setSelectedCompanies(prev => prev.filter(name => name !== companyName));
      setActiveSubmenuCompany(null);
      setAnchorEl(null);
    } else {
      // Open submenu
      setAnchorEl(event.currentTarget);
      setActiveSubmenuCompany(companyName);
    }
  };

  const handleCloseSubmenu = () => {
    setActiveSubmenuCompany(null);
    setAnchorEl(null);
  };

  const handleConfirmSubmenu = (contractData?: any) => {
    // Add the company to selected list when confirmed
    if (activeSubmenuCompany) {
      setSelectedCompanies(prev => [...prev, activeSubmenuCompany]);
      // Store contract data and lease company details
      if (contractData) {
        // Find the lease company result for this company
        const leaseCompanyResult = results.find(r => r.companyName === activeSubmenuCompany);

        setContractDataMap(prev => ({
          ...prev,
          [activeSubmenuCompany]: {
            ...contractData,
            // Add lease company screening result details
            leaseCompanyDetails: leaseCompanyResult ? {
              companyName: leaseCompanyResult.companyName,
              screeningResult: leaseCompanyResult.screeningResult,
              rates: leaseCompanyResult.rates,
              maxAmount: leaseCompanyResult.maxAmount,
              additionalConditions: leaseCompanyResult.additionalConditions,
            } : null
          }
        }));
      }
    }
    handleCloseSubmenu();
  };

  const handleConfirm = () => {
    onSelectCompany(selectedCompanies, contractDataMap);
  };

  const handlePrintPDF = async () => {
    const printJS = (await import('print-js')).default;
    printJS({
      printable: 'lease-results-printable',
      type: 'html',
      css: [
        'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
      ],
      style: `
        @media print {
          body { font-family: 'Roboto', sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .print-title { text-align: center; margin-bottom: 20px; font-size: 18px; font-weight: bold; }
          .success-text { color: #2e7d32; font-weight: bold; }
          .error-text { color: #d32f2f; font-weight: bold; }
        }
      `,
      scanStyles: false
    });
  };

  React.useEffect(() => {
    if (open) {
      setSelectedCompanies([]);
    }
  }, [open]);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 3,
            boxShadow: 6,
            backgroundColor: '#fff',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Box sx={{ position: 'absolute', right: 16, top: 16, display: 'flex', gap: 1, zIndex: 1 }}>
        <IconButton
          aria-label="print"
          onClick={handlePrintPDF}
          sx={{
            color: 'grey.600',
          }}
        >
          <PrintIcon />
        </IconButton>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: 'grey.600',
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: isMobile ? 2 : 4, pt: isMobile ? 7 : 4 }}>
        <Box id="lease-results-printable">
          <Typography className="print-title" sx={{ display: 'none', '@media print': { display: 'block' } }}>
            リース会社審査結果
          </Typography>

          {/* Mobile Card View */}
          {isMobile ? (
            <Box>
              {results.map((company) => (
              <Box key={company.companyName}>
                <CompanyCard
                  company={company}
                  isSelected={selectedCompanies.includes(company.companyName)}
                  onToggleActive={(e) => handleToggleActive(e, company.companyName)}
                />

                {/* Submenu Modal */}
                <Modal
                  open={activeSubmenuCompany === company.companyName}
                  onClose={handleCloseSubmenu}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1300
                  }}
                >
                  <ClickAwayListener onClickAway={handleCloseSubmenu}>
                    <Box>
                      <ContractRequestSubmenu
                        companyName={company.companyName}
                        maxAmount={company.maxAmount * 10000}
                        onClose={handleCloseSubmenu}
                        onConfirm={handleConfirmSubmenu}
                      />
                    </Box>
                  </ClickAwayListener>
                </Modal>
              </Box>
            ))}
          </Box>
        ) : (
          <TableContainer sx={{ my: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="15%"></TableCell>
                  {results.map((company) => (
                    <TableCell
                      key={company.companyName}
                      align="center"
                      width={`${85 / results.length}%`}
                    >
                      {company.companyName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                <TableRow>
                  <TableCell>審査結果</TableCell>
                  {results.map((company) => (
                    <TableCell
                      key={`${company.companyName}-result`}
                      align="center"
                      className={company.screeningResult === 'OK' ? 'success-text' : 'error-text'}
                      sx={{
                        color:
                          company.screeningResult === 'OK'
                            ? 'success.main'
                            : 'error.main',
                        fontWeight: 'bold',
                      }}
                    >
                      審査{company.screeningResult}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell>リース料率/期間</TableCell>
                  {results.map((company) => (
                    <TableCell
                      key={`${company.companyName}-rates`}
                      align="center"
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography>5年 {company.rates.fiveYear}</Typography>
                        <Typography>6年 {company.rates.sixYear}</Typography>
                        <Typography>7年 {company.rates.sevenYear}</Typography>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell>上限金額</TableCell>
                  {results.map((company) => (
                    <TableCell
                      key={`${company.companyName}-amount`}
                      align="center"
                    >
                      {company.maxAmount > 0
                        ? `${company.maxAmount.toLocaleString()}万円`
                        : '-'}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell>付帯条件</TableCell>
                  {results.map((company) => (
                    <TableCell
                      key={`${company.companyName}-conditions`}
                      align="center"
                    >
                      <Box sx={{ whiteSpace: 'pre-line' }}>
                        {company.additionalConditions}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow sx={{ '@media print': { display: 'none' } }}>
                  <TableCell>選択</TableCell>
                  {results.map((company) => (
                    <TableCell
                      key={`${company.companyName}-select`}
                      align="center"
                    >
                      {company.screeningResult === 'OK' && (
                        <>
                          <Button
                            variant="contained"
                            onClick={(e) => handleToggleActive(e, company.companyName)}
                            sx={{
                              backgroundColor: selectedCompanies.includes(company.companyName)
                                ? '#cccccc'
                                : '#003366',
                              color: 'white',
                              fontSize: '0.8rem',
                              padding: '6px 12px',
                              '&:hover': {
                                backgroundColor: selectedCompanies.includes(company.companyName)
                                  ? '#bbbbbb'
                                  : '#002244',
                              },
                            }}
                          >
                            {selectedCompanies.includes(company.companyName) ? '契約依頼済' : '契約依頼'}
                          </Button>

                          <Modal
                            open={activeSubmenuCompany === company.companyName}
                            onClose={handleCloseSubmenu}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1300
                            }}
                          >
                            <ClickAwayListener onClickAway={handleCloseSubmenu}>
                              <Box>
                                <ContractRequestSubmenu
                                  companyName={company.companyName}
                                  maxAmount={company.maxAmount * 10000}
                                  onClose={handleCloseSubmenu}
                                  onConfirm={handleConfirmSubmenu}
                                />
                              </Box>
                            </ClickAwayListener>
                          </Modal>
                        </>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, '@media print': { display: 'none' } }}>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={selectedCompanies.length === 0}
            sx={{
              backgroundColor: '#003366',
              color: 'white',
              px: 4,
              width: isMobile ? '100%' : 'auto',
              '&:hover': {
                backgroundColor: '#002244',
              },
              '&.Mui-disabled': {
                backgroundColor: '#cccccc',
                color: '#666666',
              },
            }}
          >
            確認
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LeaseCompanyResultsDialog;
