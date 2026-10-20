"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  HardDrive, 
  Files, 
  Share2, 
  ShieldCheck, 
  Upload, 
  ArrowRight, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  FileCode, 
  FileArchive, 
  Music, 
  Download, 
  Star,
  CheckCircle2
} from "lucide-react";
import { api, FileItem, StorageStats } from "@/lib/api";

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [s, f] = await Promise.all([
        api.getStorageStats(),
        api.listFiles({ is_trashed: false }),
      ]);
      setStats(s);
      setRecentFiles(f.slice(0, 8));
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setStatusMsg(`Uploading ${file.name}...`);

    try {
      await api.uploadFile(file, null, (pct) => setUploadProgress(pct));
      setStatusMsg("Upload completed successfully!");
      setTimeout(() => setStatusMsg(null), 3000);
      await loadData();
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const intent = await api.getDownloadIntent(file.id);
      window.open(intent.download_url, "_blank");
    } catch (err: any) {
      alert(`Could not download: ${err.message}`);
    }
  };

  const handleToggleFavorite = async (file: FileItem) => {
    try {
      await api.patchFile(file.id, { is_favorite: !file.is_favorite });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (mime: string, name: string) => {
    if (mime.startsWith("image/")) return <ImageIcon className="w-4 h-4 text-emerald-600" />;
    if (mime.startsWith("video/")) return <Video className="w-4 h-4 text-purple-600" />;
    if (mime.startsWith("audio/")) return <Music className="w-4 h-4 text-amber-600" />;
    if (mime.includes("pdf") || mime.includes("word") || name.endsWith(".pdf") || name.endsWith(".docx")) {
      return <FileText className="w-4 h-4 text-blue-600" />;
    }
    if (name.endsWith(".zip") || name.endsWith(".tar") || name.endsWith(".gz")) {
      return <FileArchive className="w-4 h-4 text-orange-600" />;
    }
    return <FileCode className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Upload Notification */}
      {statusMsg && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 flex items-center justify-between">
          <span>{statusMsg}</span>
          {uploading && <span className="font-semibold">{uploadProgress}%</span>}
        </div>
      )}

      {/* Top Banner & Quick Upload */}
      <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            Welcome to your Cloudora Workspace
          </h1>
          <p className="text-sm text-[#6E6E73] mt-1">
            All your files are safely encrypted in private cloud object storage.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-sm font-medium cursor-pointer transition-all shadow-sm">
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
            <input 
              type="file" 
              onChange={handleFileUpload} 
              disabled={uploading} 
              className="hidden" 
            />
          </label>
          <Link
            href="/dashboard/files"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-sm font-medium transition-all"
          >
            <span>Browse All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA] shadow-2xs">
          <div className="flex items-center justify-between mb-3 text-[#6E6E73]">
            <span className="text-xs font-medium uppercase tracking-wider">Storage Usage</span>
            <HardDrive className="w-4 h-4 text-[#0071E3]" />
          </div>
          <div className="text-2xl font-semibold text-[#1D1D1F]">
            {stats ? formatBytes(stats.used_bytes) : "0 B"}
          </div>
          <div className="text-xs text-[#86868B] mt-1">
            {stats ? `${stats.used_percent}% of ${formatBytes(stats.quota_bytes)}` : "5 GB quota"}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA] shadow-2xs">
          <div className="flex items-center justify-between mb-3 text-[#6E6E73]">
            <span className="text-xs font-medium uppercase tracking-wider">Total Files</span>
            <Files className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-semibold text-[#1D1D1F]">
            {stats ? stats.file_count : 0}
          </div>
          <div className="text-xs text-[#86868B] mt-1">Stored across all folders</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA] shadow-2xs">
          <div className="flex items-center justify-between mb-3 text-[#6E6E73]">
            <span className="text-xs font-medium uppercase tracking-wider">Privacy & Bucket</span>
            <ShieldCheck className="w-4 h-4 text-[#0071E3]" />
          </div>
          <div className="text-2xl font-semibold text-[#1D1D1F]">Private</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">100% Tenant-Isolated</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA] shadow-2xs">
          <div className="flex items-center justify-between mb-3 text-[#6E6E73]">
            <span className="text-xs font-medium uppercase tracking-wider">Trash Retention</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-semibold text-[#1D1D1F]">30 Days</div>
          <div className="text-xs text-[#86868B] mt-1">Soft-delete protection active</div>
        </div>
      </div>

      {/* Storage Breakdown */}
      {stats && stats.by_category && (
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#1D1D1F]">Storage Category Breakdown</h3>
            <Link href="/dashboard/storage" className="text-xs font-medium text-[#0071E3] hover:underline">
              View Detailed Analytics
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5EA]">
              <span className="text-xs text-[#6E6E73]">Images</span>
              <div className="text-sm font-semibold mt-1">{formatBytes(stats.by_category.images)}</div>
            </div>
            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5EA]">
              <span className="text-xs text-[#6E6E73]">Videos</span>
              <div className="text-sm font-semibold mt-1">{formatBytes(stats.by_category.videos)}</div>
            </div>
            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5EA]">
              <span className="text-xs text-[#6E6E73]">Documents</span>
              <div className="text-sm font-semibold mt-1">{formatBytes(stats.by_category.documents)}</div>
            </div>
            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5EA]">
              <span className="text-xs text-[#6E6E73]">Audio</span>
              <div className="text-sm font-semibold mt-1">{formatBytes(stats.by_category.audio)}</div>
            </div>
            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5EA]">
              <span className="text-xs text-[#6E6E73]">Archives</span>
              <div className="text-sm font-semibold mt-1">{formatBytes(stats.by_category.archives)}</div>
            </div>
            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5EA]">
              <span className="text-xs text-[#6E6E73]">Code</span>
              <div className="text-sm font-semibold mt-1">{formatBytes(stats.by_category.code)}</div>
            </div>
            <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5EA]">
              <span className="text-xs text-[#6E6E73]">Others</span>
              <div className="text-sm font-semibold mt-1">{formatBytes(stats.by_category.others)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Files Section */}
      <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#1D1D1F]">Recent Files</h3>
          <Link href="/dashboard/files" className="text-xs font-medium text-[#0071E3] hover:underline">
            View All Files
          </Link>
        </div>

        {recentFiles.length === 0 ? (
          <div className="text-center py-12 text-[#86868B]">
            <Files className="w-10 h-10 mx-auto mb-2 text-[#D1D1D6]" />
            <p className="text-sm font-medium">No files uploaded yet</p>
            <p className="text-xs mt-1">Upload your first document, photo, or archive using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5E5EA] text-xs font-medium text-[#86868B]">
                  <th className="pb-3 pl-2">Name</th>
                  <th className="pb-3">Size</th>
                  <th className="pb-3">Uploaded</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {recentFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#FAFAFA] transition-colors group">
                    <td className="py-3 pl-2 flex items-center space-x-2.5">
                      {getFileIcon(file.mime_type, file.display_name)}
                      <span className="font-medium text-[#1D1D1F] truncate max-w-xs">{file.display_name}</span>
                    </td>
                    <td className="py-3 text-xs text-[#6E6E73]">{formatBytes(file.size_bytes)}</td>
                    <td className="py-3 text-xs text-[#6E6E73]">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right pr-2 space-x-2">
                      <button
                        onClick={() => handleToggleFavorite(file)}
                        title={file.is_favorite ? "Unstar" : "Star"}
                        className={`p-1.5 rounded-lg ${file.is_favorite ? "text-amber-500" : "text-[#86868B] hover:text-amber-500"}`}
                      >
                        <Star className={`w-4 h-4 ${file.is_favorite ? "fill-amber-500" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleDownload(file)}
                        title="Download"
                        className="p-1.5 rounded-lg text-[#86868B] hover:text-[#0071E3] transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
