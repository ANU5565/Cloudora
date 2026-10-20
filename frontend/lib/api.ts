export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  storage_quota_bytes: number;
  storage_used_bytes: number;
  created_at: string;
}

export interface FileItem {
  id: string;
  owner_id: string;
  folder_id: string | null;
  display_name: string;
  mime_type: string;
  size_bytes: number;
  upload_status: string;
  checksum: string | null;
  is_favorite: boolean;
  is_trashed: boolean;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FolderItem {
  id: string;
  owner_id: string;
  parent_id: string | null;
  name: string;
  is_trashed: boolean;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export interface FolderContents {
  current_folder: FolderItem | null;
  breadcrumbs: BreadcrumbItem[];
  folders: FolderItem[];
  files: FileItem[];
}

export interface StorageStats {
  quota_bytes: number;
  used_bytes: number;
  remaining_bytes: number;
  used_percent: number;
  file_count: number;
  by_category: {
    images: number;
    videos: number;
    documents: number;
    audio: number;
    archives: number;
    code: number;
    others: number;
  };
  largest_files: FileItem[];
}

export interface ShareItem {
  id: string;
  file_id: string | null;
  folder_id: string | null;
  access_policy: string;
  has_password: boolean;
  expires_at: string | null;
  is_revoked: boolean;
  created_at: string;
  share_url?: string;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("cloudora_token");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail?.message || errorData.detail || errorMsg;
      } catch {
        // fallback to status text
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // Auth
  async register(data: any): Promise<User> {
    return this.request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: any): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("cloudora_token", res.access_token);
      localStorage.setItem("cloudora_user", JSON.stringify(res.user));
    }
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cloudora_token");
      localStorage.removeItem("cloudora_user");
    }
  }

  // Files
  async listFiles(params?: { folder_id?: string | null; is_trashed?: boolean; is_favorite?: boolean }): Promise<FileItem[]> {
    const q = new URLSearchParams();
    if (params?.folder_id !== undefined && params.folder_id !== null) q.set("folder_id", params.folder_id);
    if (params?.is_trashed !== undefined) q.set("is_trashed", String(params.is_trashed));
    if (params?.is_favorite !== undefined) q.set("is_favorite", String(params.is_favorite));
    return this.request<FileItem[]>(`/files?${q.toString()}`);
  }

  async createUploadIntent(data: { filename: string; size_bytes: number; mime_type?: string; folder_id?: string | null }) {
    return this.request<{
      file_id: string;
      upload_session_id: string;
      upload_url: string;
      method: string;
      headers: Record<string, string>;
      expires_at: string;
    }>("/files/upload-intents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async completeUpload(fileId: string, uploadSessionId: string): Promise<FileItem> {
    return this.request<FileItem>(`/files/${fileId}/complete-upload`, {
      method: "POST",
      body: JSON.stringify({ upload_session_id: uploadSessionId }),
    });
  }

  async getDownloadIntent(fileId: string): Promise<{ download_url: string; filename: string }> {
    return this.request<{ download_url: string; filename: string }>(`/files/${fileId}/download-intent`, {
      method: "POST",
    });
  }

  async patchFile(fileId: string, data: { display_name?: string; folder_id?: string | null; is_favorite?: boolean }): Promise<FileItem> {
    return this.request<FileItem>(`/files/${fileId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async trashFile(fileId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/files/${fileId}`, { method: "DELETE" });
  }

  async restoreFile(fileId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/files/${fileId}/restore`, { method: "POST" });
  }

  async permanentDeleteFile(fileId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/files/${fileId}/permanent`, { method: "DELETE" });
  }

  // Folders
  async listFolders(parentId?: string | null): Promise<FolderItem[]> {
    const q = parentId !== undefined && parentId !== null ? `?parent_id=${parentId}` : "";
    return this.request<FolderItem[]>(`/folders${q}`);
  }

  async createFolder(name: string, parentId?: string | null): Promise<FolderItem> {
    return this.request<FolderItem>("/folders", {
      method: "POST",
      body: JSON.stringify({ name, parent_id: parentId || null }),
    });
  }

  async getFolderContents(folderId: string): Promise<FolderContents> {
    return this.request<FolderContents>(`/folders/${folderId}/contents`);
  }

  async trashFolder(folderId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/folders/${folderId}`, { method: "DELETE" });
  }

  // Storage
  async getStorageStats(): Promise<StorageStats> {
    return this.request<StorageStats>("/storage/stats");
  }

  // Shares
  async createShare(data: { file_id?: string; folder_id?: string; access_policy: string; password?: string; expires_hours?: number }): Promise<ShareItem> {
    return this.request<ShareItem>("/shares", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listShares(): Promise<ShareItem[]> {
    return this.request<ShareItem[]>("/shares");
  }

  async revokeShare(shareId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/shares/${shareId}`, { method: "DELETE" });
  }

  // Search
  async search(query: string, fileType?: string): Promise<{ files: FileItem[]; folders: FolderItem[] }> {
    const q = new URLSearchParams({ q: query });
    if (fileType) q.set("file_type", fileType);
    return this.request<{ files: FileItem[]; folders: FolderItem[] }>(`/search?${q.toString()}`);
  }

  // Public share access
  async getPublicShare(token: string, password?: string) {
    const res = await fetch(`${API_BASE}/shares/public/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message || err.detail || "Unable to access share");
    }
    return res.json();
  }

  // Perform full file upload pipeline to Cloudora
  async uploadFile(file: File, folderId?: string | null, onProgress?: (pct: number) => void): Promise<FileItem> {
    // 1. Get upload intent
    const intent = await this.createUploadIntent({
      filename: file.name,
      size_bytes: file.size,
      mime_type: file.type || "application/octet-stream",
      folder_id: folderId,
    });

    // 2. Upload file content to presigned URL (S3 or LocalStorageProvider)
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(intent.method || "PUT", intent.upload_url);

      if (intent.headers) {
        Object.entries(intent.headers).forEach(([k, v]) => {
          xhr.setRequestHeader(k, v);
        });
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            onProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during file upload"));
      xhr.send(file);
    });

    // 3. Complete upload on backend
    return await this.completeUpload(intent.file_id, intent.upload_session_id);
  }
}

export const api = new ApiClient();
