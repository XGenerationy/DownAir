const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((error as { error?: string }).error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MediaAnalysisData {
  analysis: {
    platform: string;
    mediaType: string;
    title: string;
    thumbnail?: string;
    duration?: number;
    author?: string;
    description?: string;
    url: string;
    formats: {
      formatId: string;
      format: string;
      quality: string;
      mimeType: string;
      fileSize?: string;
      isAudioOnly: boolean;
    }[];
  };
  downloadId: number;
}

export interface DownloadCreateData {
  token: string;
  downloadId: number;
}

export interface DownloadStatsData {
  total: number;
  platforms: Record<string, number>;
}

export interface ContentPageData {
  id: number;
  slug: string;
  title: string;
  category: string;
  metaDescription: string | null;
  content: string;
  isPublished: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  stats: {
    totalDownloads: number;
    totalContentPages: number;
    publishedPages: number;
    draftPages: number;
    contactSubmissions: number;
    dmcaRequests: number;
    pendingDmca: number;
  };
  recentActivity: {
    id: number;
    action: string;
    entity: string;
    entityId: number | null;
    details: Record<string, unknown> | null;
    createdAt: string;
  }[];
}

export interface ContactData {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface DmcaData {
  id: number;
  copyrightOwner: string;
  email: string;
  contentUrl: string;
  originalUrl: string;
  description: string | null;
  signature: string;
  status: string;
  createdAt: string;
}

export const api = {
  analyze: (url: string) =>
    request<ApiResponse<MediaAnalysisData>>('/download/analyze', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  createDownload: (url: string, formatId: string, quality?: string) =>
    request<ApiResponse<DownloadCreateData>>('/download/create', {
      method: 'POST',
      body: JSON.stringify({ url, formatId, quality }),
    }),

  getDownloadUrl: (token: string) => `${API_BASE}/download/proxy/${encodeURIComponent(token)}`,

  getStats: () => request<ApiResponse<DownloadStatsData>>('/download/stats'),

  submitContact: (data: { name: string; email: string; subject: string; message: string }) =>
    request<ApiResponse>('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitDmca: (data: {
    copyrightOwner: string;
    email: string;
    contentUrl: string;
    originalUrl: string;
    description?: string;
    signature: string;
  }) =>
    request<ApiResponse>('/dmca', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getGuides: (params?: { category?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.page) searchParams.set('page', String(params.page));
    return request<ApiResponse<ContentPageData[]>>(`/guides?${searchParams.toString()}`);
  },

  getGuide: (slug: string) => request<ApiResponse<ContentPageData>>(`/guides/${encodeURIComponent(slug)}`),

  getCategories: () => request<ApiResponse<string[]>>('/guides/categories'),

  getSetupStatus: () => request<ApiResponse<{ completed: boolean }>>('/setup/status'),

  testDb: (data: { dbHost: string; dbPort: number; dbName: string; dbUser: string; dbPassword: string }) =>
    request<ApiResponse<{ connected: boolean }>>('/setup/test-db', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  completeSetup: (data: Record<string, unknown>) =>
    request<ApiResponse>('/setup/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminLogin: (email: string, password: string) =>
    request<ApiResponse<{ token: string; admin: { id: number; email: string; name: string } }>>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  adminLogout: () => request<ApiResponse>('/admin/logout', { method: 'POST' }),

  adminMe: () => request<ApiResponse<{ id: number; email: string }>>('/admin/me'),

  adminDashboard: () => request<ApiResponse<DashboardData>>('/admin/dashboard'),

  adminGetContent: () => request<ApiResponse<ContentPageData[]>>('/admin/content'),

  adminGetContentPage: (id: number) =>
    request<ApiResponse<ContentPageData>>(`/admin/content/${id}`),

  adminCreateContent: (data: Record<string, unknown>) =>
    request<ApiResponse<ContentPageData>>('/admin/content', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminUpdateContent: (id: number, data: Record<string, unknown>) =>
    request<ApiResponse<ContentPageData>>(`/admin/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  adminDeleteContent: (id: number) =>
    request<ApiResponse>(`/admin/content/${id}`, { method: 'DELETE' }),

  adminGetContacts: () => request<ApiResponse<ContactData[]>>('/admin/contacts'),

  adminMarkContactRead: (id: number) =>
    request<ApiResponse>(`/admin/contacts/${id}/read`, { method: 'PUT' }),

  adminGetDmca: () => request<ApiResponse<DmcaData[]>>('/admin/dmca'),

  adminUpdateDmcaStatus: (id: number, status: string) =>
    request<ApiResponse>(`/admin/dmca/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  adminChangePassword: (currentPassword: string, newPassword: string) =>
    request<ApiResponse>('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
