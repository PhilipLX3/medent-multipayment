// Applications API interfaces and types
export interface SystemValue {
  name: string;
  nameJp?: string;
  enumValue: string;
}

export interface UserBrief {
  id: number;
  uuid: string;
  name: string;
  email: string;
}

export interface ApplicationResponse {
  id: number;
  uuid: string;
  applicationNumber: string;
  customerId: string;
  corporateName: string;
  clinicName: string;
  propertyName: string;
  amount: number;
  picName: string;
  applicationUrl: string;
  sentToEmail: string;
  qrCodeUrl: string;
  createdByUser: UserBrief;
  status: SystemValue;
  applicationMode: SystemValue;
  // Full response includes additional fields
  clinicAddress?: string;
  clinicTel?: string;
  representativeLastName?: string;
  representativeFirstName?: string;
  representativeAddress?: string;
  representativeTel?: string;
  representativeBirthDate?: string;
  sentToEmailAt?: string;
  completedAt?: string;
  submittedAt?: string;
  attachmentList?: AttachmentResponse[];
}

export interface AttachmentResponse {
  id: number;
  uuid: string;
  entityType: string;
  entityId: string;
  originalFilename: string;
  attachmentUrl: string;
  mimeType: string;
  fileSize: number;
  description?: string | null;
  version: number;
  lastAccessedAt?: string;
  accessCount: number;
}

export interface CreateApplicationRequest {
  customerId?: string;
  businessType?: string;
  businessName?: string;
  corporateName?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicTel?: string;
  representativeLastName?: string;
  representativeFirstName?: string;
  representativeLastNameFurigana?: string;
  representativeFirstNameFurigana?: string;
  representativeAddress?: string;
  representativeTel?: string;
  representativeBirthDate?: string;
  propertyName?: string;
  amount?: number;
  picName?: string;
}

export interface UpdateApplicationRequest extends CreateApplicationRequest {
  // Same fields as create - all optional for updates
}

export interface SendToClinicRequest {
  email: string;
}

export interface ApplicationFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  applicationNumber?: string;
  clinicName?: string;
  corporateName?: string;
  propertyName?: string;
  customerId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  createdFrom?: string;
  createdTo?: string;
  submittedFrom?: string;
  submittedTo?: string;
}

export interface ApplicationsListResponse {
  data: ApplicationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
