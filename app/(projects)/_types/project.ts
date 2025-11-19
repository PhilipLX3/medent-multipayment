export interface Project {
  id: string;
  project_number: string;
  patient_id: string;
  patient_name: string;
  treatment_name: string;
  project_amount: number;
  loan_type: string;
  finance_company_name: string;
  project_type: 'normal' | 'special';
  status: string;
  application_date: string;
  approval_date?: string | null;
  completion_date?: string | null;
  alert_message?: string | null;
  created_at: string;
  updated_at: string;
  
  // Legacy/UI compatibility fields (these map to the above fields)
  customerId?: string; // maps to patient_id
  clinicName?: string; // maps to patient_name or clinic info
  itemName?: string; // maps to treatment_name
  amount?: number; // maps to project_amount
  leasingCompany?: string; // maps to finance_company_name
  applicationRequestDate?: string; // maps to application_date
  applicationDate?: string; // maps to application_date
  contractRequestDate?: string | null; // additional field for UI
  isContractable?: boolean; // computed field for UI
}

export interface ProjectFilters {
  // Pagination
  limit?: number; // Number of items per page, Default: 10
  offset?: number; // Number of records to skip, Default: 0
  
  // Sorting
  isDescByCreatedAt?: boolean; // Sort by createdAt descending, Default: true
  
  // Date filters
  createdDateFrom?: string; // ISO date-time string
  createdDateTo?: string; // ISO date-time string
  applicationRequestDateFrom?: string; // Application submitted date from
  applicationRequestDateTo?: string; // Application submitted date to
  applicationDateFrom?: string; // Application screening start date from
  applicationDateTo?: string; // Application screening start date to
  
  // Status and ID filters
  statusIds?: string; // Comma-separated PROJECT_STATUS IDs (e.g., "112,113")
  projectNumber?: string; // Project number search
  customerId?: string; // Customer ID search
  
  // Business and clinic info
  businessName?: string; // Business name search
  clinicName?: string; // Clinic name search
  
  // Amount range filters
  minAmount?: number; // Minimum amount filter
  maxAmount?: number; // Maximum amount filter
  
  // Legacy fields (for backward compatibility)
  status?: string; // Kept for existing code compatibility
  patient_name?: string; // Maps to clinicName
  project_type?: 'normal' | 'special';
  finance_company_name?: string;
  from_date?: string; // Maps to createdDateFrom
  to_date?: string; // Maps to createdDateTo
  page?: number; // Maps to offset calculation
  search?: string; // General search parameter (if supported)
}

export interface CreateProjectRequest {
  patient_id: string;
  patient_name: string;
  treatment_name: string;
  project_amount: number;
  loan_type: string;
  finance_company_name: string;
  project_type: 'normal' | 'special';
  status?: string;
  application_date?: string;
}

export interface UpdateProjectRequest {
  patient_name?: string;
  treatment_name?: string;
  project_amount?: number;
  loan_type?: string;
  finance_company_name?: string;
  project_type?: 'normal' | 'special';
  status?: string;
  approval_date?: string;
  completion_date?: string;
}

export interface ProjectsResponse {
  projects: Project[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
