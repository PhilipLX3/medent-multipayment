import api from '@/shared/services/api';
import {
  ApiResponse,
  Project,
  ProjectFilters,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectsResponse,
} from '@/shared/types';

export const projectService = {
  /**
   * Get all projects with optional filters
   * GET /api/v1/projects
   */
  getProjects: (filters?: ProjectFilters) => {
    return api.get<ApiResponse<ProjectsResponse>>('/v1/projects', {
      params: filters,
    });
  },

  /**
   * Get a specific project by ID
   * GET /api/v1/projects/{id}
   */
  getById: (id: string) => {
    return api.get<ApiResponse<Project>>(`/v1/projects/${id}`);
  },

  /**
   * Create a new project
   * POST /api/v1/projects
   */
  create: (data: CreateProjectRequest) => {
    return api.post<ApiResponse<Project>>('/v1/projects', data);
  },

  /**
   * Update an existing project
   * PUT /api/v1/projects/{id}
   */
  update: (id: string, data: UpdateProjectRequest) => {
    return api.put<ApiResponse<Project>>(`/v1/projects/${id}`, data);
  },

  /**
   * Delete a project
   * DELETE /api/v1/projects/{id}
   */
  delete: (id: string) => {
    return api.delete<ApiResponse<null>>(`/v1/projects/${id}`);
  },

  /**
   * Update project status
   * PATCH /api/v1/projects/{id}/status
   */
  updateStatus: (id: string, status: string) => {
    return api.patch<ApiResponse<Project>>(`/v1/projects/${id}/status`, { status });
  },

  /**
   * Approve project
   * POST /api/v1/projects/{id}/approve
   */
  approve: (id: string) => {
    return api.post<ApiResponse<Project>>(`/v1/projects/${id}/approve`);
  },

  /**
   * Complete project
   * POST /api/v1/projects/{id}/complete
   */
  complete: (id: string) => {
    return api.post<ApiResponse<Project>>(`/v1/projects/${id}/complete`);
  },

  /**
   * Export projects to CSV
   * GET /api/v1/projects/export
   */
  export: (filters?: ProjectFilters) => {
    return api.get('/v1/projects/export', {
      params: filters,
      responseType: 'blob', // Important for file downloads
    });
  },
};
