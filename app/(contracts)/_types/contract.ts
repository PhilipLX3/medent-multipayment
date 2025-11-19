export interface Contract {
  id: string;
  contract_number: string;
  patient_id: string;
  patient_name: string;
  treatment_name: string;
  contract_amount: number;
  loan_type: string;
  finance_company_name: string;
  contract_type: 'normal' | 'special';
  status: string;
  application_date: string;
  approval_date?: string | null;
  completion_date?: string | null;
  alert_message?: string | null;
  created_at: string;
  updated_at: string;
  // Additional contract-specific fields
  monthly_payment?: number;
  payment_count?: number;
  interest_rate?: number;
  service_completion_rate?: number;
  
  // Legacy/UI compatibility fields (these map to the above fields)
  customerId?: string; // maps to patient_id
  corporateName?: string; // maps to patient_name or clinic info
  clinicName?: string; // maps to patient_name or clinic info
  propertyName?: string; // maps to treatment_name
  amount?: number; // maps to contract_amount
  leaseCompany?: string; // maps to finance_company_name
  contractRequestDate?: string | null; // maps to application_date
  inspectionConfirmationDate?: string | null; // maps to approval_date
  contractDate?: string | null; // maps to completion_date

  // Contract details data for viewing
  contractData?: any;
  allContractsData?: any[];
}

export interface ContractFilters {
  status?: string;
  patient_name?: string;
  contract_type?: 'normal' | 'special';
  finance_company_name?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export interface CreateContractRequest {
  patient_id: string;
  patient_name: string;
  treatment_name: string;
  contract_amount: number;
  loan_type: string;
  finance_company_name: string;
  contract_type: 'normal' | 'special';
  status?: string;
  monthly_payment?: number;
  payment_count?: number;
  interest_rate?: number;
}

export interface UpdateContractRequest {
  patient_name?: string;
  treatment_name?: string;
  contract_amount?: number;
  loan_type?: string;
  finance_company_name?: string;
  contract_type?: 'normal' | 'special';
  status?: string;
  approval_date?: string;
  completion_date?: string;
  monthly_payment?: number;
  payment_count?: number;
  interest_rate?: number;
  service_completion_rate?: number;
}

export interface ContractsResponse {
  contracts: Contract[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
