import api from '@/shared/services/api';
import { ApiResponse } from '@/shared/types';
import {
  ApplicationResponse,
  ApplicationsListResponse,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  SendToClinicRequest,
  ApplicationFilters,
  AttachmentResponse
} from '@/shared/types/application';

export const applicationService = {
  /**
   * Create a new lease application
   * POST /api/v1/applications
   */
  create: (data: CreateApplicationRequest) => {
    return api.post<ApiResponse<ApplicationResponse>>('/v1/applications', data);
  },

  /**
   * Get application by UUID
   * GET /api/v1/applications/{id}
   */
  getById: (uuid: string) => {
    return api.get<ApiResponse<ApplicationResponse>>(`/v1/applications/${uuid}`);
  },

  /**
   * Update application fields
   * PATCH /api/v1/applications/{id}
   */
  update: (uuid: string, data: UpdateApplicationRequest) => {
    return api.patch<ApiResponse<ApplicationResponse>>(`/v1/applications/${uuid}`, data);
  },

  /**
   * Delete application
   * DELETE /api/v1/applications/{id}
   */
  delete: (uuid: string) => {
    return api.delete<ApiResponse<null>>(`/v1/applications/${uuid}`);
  },

  /**
   * Send application to clinic via email
   * POST /api/v1/applications/{id}/send-email
   */
  sendToClinic: (uuid: string, data: SendToClinicRequest) => {
    return api.post<ApiResponse<null>>(`/v1/applications/${uuid}/send-email`, data);
  },

  /**
   * Get all applications with filtering and pagination
   * GET /api/v1/applications
   */
  getAll: (filters?: ApplicationFilters) => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const query = params.toString();
    const endpoint = query ? `/v1/applications?${query}` : '/v1/applications';
    
    return api.get<ApiResponse<ApplicationsListResponse>>(endpoint);
  },

  /**
   * Get attachments for an application
   * GET /api/v1/applications/{id}/attachments
   */
  getAttachments: (uuid: string) => {
    return api.get<ApiResponse<AttachmentResponse[]>>(`/v1/applications/${uuid}/attachments`);
  },

  /**
   * Submit application for screening
   * POST /api/v1/applications/{id}/submit
   */
  submitForScreening: (uuid: string) => {
    return api.post<ApiResponse<ApplicationResponse | null>>(`/v1/applications/${uuid}/submit`);
  },

  /**
   * Mark application as ready to submit
   * PATCH /api/v1/applications/{id}/ready-to-submit
   */
  markAsReadyToSubmit: (uuid: string) => {
    return api.patch<ApiResponse<ApplicationResponse>>(`/v1/applications/${uuid}/ready-to-submit`);
  },

  /**
   * Get a single attachment by UUID
   * GET /api/v1/attachments/{id}
   */
  getAttachment: (attachmentUuid: string) => {
    return api.get<ApiResponse<AttachmentResponse>>(`/v1/attachments/${attachmentUuid}`);
  },

  /**
   * Delete an attachment by UUID
   * DELETE /api/v1/attachments/{id}
   */
  deleteAttachment: (attachmentUuid: string) => {
    return api.delete<ApiResponse<null>>(`/v1/attachments/${attachmentUuid}`);
  },

  /**
   * Upload a single attachment for an application
   * POST /api/v1/attachments
   */
  uploadAttachment: (applicationUuid: string, file: File, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'applications');
    formData.append('entityUuid', applicationUuid);
    if (description) {
      formData.append('description', description);
    }

    return api.post<ApiResponse<AttachmentResponse>>('/v1/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Upload multiple attachments for an application
   * POST /api/v1/attachments (multiple calls)
   */
  uploadAttachments: async (applicationUuid: string, files: File[]) => {
    const uploadPromises = files.map(file => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'applications');
      formData.append('entityUuid', applicationUuid);

      return api.post<ApiResponse<AttachmentResponse>>('/v1/attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    });
    
    const results = await Promise.all(uploadPromises);
    return results;
  },
};
