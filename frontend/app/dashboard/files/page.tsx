"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Folder as FolderIcon, 
  FolderPlus, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  FileCode, 
  FileArchive, 
  Music, 
  MoreVertical, 
  Download, 
  Share2, 
  Trash2, 
  Edit2, 
  Star, 
  ChevronRight, 
  Check, 
  Copy, 
  Lock, 
  X,
  LayoutGrid,
  List
} from "lucide-react";
import { api, FileItem, FolderItem, BreadcrumbItem } from "@/lib/api";

function FileExplorerContent() {
  const searchParams = useSearchParams();
  const searchParamQuery = searchParams.get("q") || "";
  const actionParam = searchParams.get("action");

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Modals state
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [shareTarget, setShareTarget] = useState<FileItem | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [shareHours, setShareHours] = useState(24);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Uploading
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadFolderContents = async (folderId: string | null) => {
    setLoading(true);
    try {
      if (searchParamQuery) {
        const results = await api.search(searchParamQuery);
        setFiles(results.files);
        setFolders(results.folders);
        setBreadcrumbs([{ id: null, name: `Search: "${searchParamQuery}"` }]);
      } else if (folderId) {
        const contents = await api.getFolderContents(folderId);
        setFolders(contents.folders);
        setFiles(contents.files);
        setBreadcrumbs(contents.breadcrumbs);
      } else {
        const [rootFolders, rootFiles] = await Promise.all([
          api.listFolders("root"),
          api.listFiles({ folder_id: "root", is_trashed: false }),
        ]);
        setFolders(rootFolders);
        setFiles(rootFiles);
        setBreadcrumbs([{ id: null, name: "All Files" }]);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolderContents(currentFolderId);
    if (actionParam === "new-folder") setNewFolderOpen(true);
  }, [currentFolderId, searchParamQuery, actionParam]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder(newFolderName.trim(), currentFolderId);
      setNewFolderName("");
      setNewFolderOpen(false);
      await loadFolderContents(currentFolderId);
    } catch (err: any) {
      alert(`Error creating folder: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      await api.uploadFile(file, currentFolderId, (pct) => setUploadProgress(pct));
      await loadFolderContents(currentFolderId);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
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
      await loadFolderContents(currentFolderId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await api.patchFile(renameTarget.id, { display_name: renameValue.trim() });
      setRenameTarget(null);
      await loadFolderContents(currentFolderId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTrash = async (file: FileItem) => {
    if (!confirm(`Move "${file.display_name}" to trash?`)) return;
    try {
      await api.trashFile(file.id);
      await loadFolderContents(currentFolderId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareTarget) return;

    try {
      const share = await api.createShare({
        file_id: shareTarget.id,
        access_policy: "download",
        password: sharePassword || undefined,
        expires_hours: shareHours,
      });
      setGeneratedShareUrl(share.share_url || "");
    } catch (err: any) {
      alert(`Failed to create share: ${err.message}`);
    }
  };

  const copyShareLink = () => {
    if (generatedShareUrl) {
      navigator.clipboard.writeText(generatedShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    if (mime.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-emerald-600" />;
    if (mime.startsWith("video/")) return <Video className="w-5 h-5 text-purple-600" />;
    if (mime.startsWith("audio/")) return <Music className="w-5 h-5 text-amber-600" />;
    if (mime.includes("pdf") || mime.includes("word") || name.endsWith(".pdf") || name.endsWith(".docx")) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (name.endsWith(".zip") || name.endsWith(".tar") || name.endsWith(".gz")) {
      return <FileArchive className="w-5 h-5 text-orange-600" />;
    }
    return <FileCode className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Action Bar & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5EA]">
        {/* Breadcrumb Trail */}
        <nav className="flex items-center space-x-1.5 text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id || idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#86868B]" />}
              <button
                onClick={() => setCurrentFolderId(crumb.id)}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  idx === breadcrumbs.length - 1
                    ? "font-semibold text-[#1D1D1F]"
                    : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F2F2F7]"
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </nav>

        {/* View Toggle & Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-[#F2F2F7] rounded-lg p-0.5 border border-[#E5E5EA]">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-white text-[#1D1D1F] shadow-2xs" : "text-[#86868B]"}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-white text-[#1D1D1F] shadow-2xs" : "text-[#86868B]"}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setNewFolderOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5EA] bg-white text-xs font-medium text-[#1D1D1F] hover:bg-[#F2F2F7] transition-colors shadow-2xs"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>New Folder</span>
          </button>

          <label className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium cursor-pointer transition-colors shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
            <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
      </div>

      {/* Uploading Banner */}
      {uploading && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 flex items-center justify-between">
          <span>Uploading file into {breadcrumbs[breadcrumbs.length - 1]?.name}...</span>
          <span className="font-semibold">{uploadProgress}%</span>
        </div>
      )}

      {/* Folders Section */}
      {folders.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-3">Folders</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setCurrentFolderId(f.id)}
                className="p-3.5 rounded-xl bg-white border border-[#E5E5EA] hover:border-[#0071E3] transition-all text-left flex items-center space-x-3 group shadow-2xs"
              >
                <FolderIcon className="w-6 h-6 text-[#0071E3] shrink-0" />
                <span className="text-sm font-medium text-[#1D1D1F] truncate group-hover:text-[#0071E3]">
                  {f.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div>
        <h4 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-3">Files</h4>

        {loading ? (
          <div className="py-16 text-center text-[#86868B]">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="py-16 text-center text-[#86868B] rounded-2xl bg-white border border-[#E5E5EA]">
            <FolderIcon className="w-10 h-10 mx-auto mb-2 text-[#D1D1D6]" />
            <p className="text-sm font-medium">This folder is empty</p>
            <p className="text-xs mt-1">Upload a file or create a subfolder to get started.</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="rounded-2xl bg-white border border-[#E5E5EA] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5E5EA] text-xs font-medium text-[#86868B] bg-[#FAFAFA]">
                  <th className="py-3 pl-4">Name</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Size</th>
                  <th className="py-3">Modified</th>
                  <th className="py-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3 pl-4 flex items-center space-x-3">
                      {getFileIcon(file.mime_type, file.display_name)}
                      <span className="font-medium text-[#1D1D1F] truncate max-w-xs">{file.display_name}</span>
                    </td>
                    <td className="py-3 text-xs text-[#6E6E73] truncate max-w-[120px]">{file.mime_type}</td>
                    <td className="py-3 text-xs text-[#6E6E73]">{formatBytes(file.size_bytes)}</td>
                    <td className="py-3 text-xs text-[#6E6E73]">{new Date(file.updated_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right pr-4 space-x-1">
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
                      <button
                        onClick={() => {
                          setShareTarget(file);
                          setGeneratedShareUrl(null);
                        }}
                        title="Share"
                        className="p-1.5 rounded-lg text-[#86868B] hover:text-[#0071E3] transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setRenameTarget(file);
                          setRenameValue(file.display_name);
                        }}
                        title="Rename"
                        className="p-1.5 rounded-lg text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTrash(file)}
                        title="Move to Trash"
                        className="p-1.5 rounded-lg text-[#86868B] hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <div key={file.id} className="p-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-2xs flex flex-col justify-between hover:border-[#0071E3] transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {getFileIcon(file.mime_type, file.display_name)}
                    <button
                      onClick={() => handleToggleFavorite(file)}
                      className={file.is_favorite ? "text-amber-500" : "text-[#86868B]"}
                    >
                      <Star className={`w-4 h-4 ${file.is_favorite ? "fill-amber-500" : ""}`} />
                    </button>
                  </div>
                  <h4 className="text-sm font-semibold text-[#1D1D1F] truncate">{file.display_name}</h4>
                  <p className="text-xs text-[#86868B] mt-1">{formatBytes(file.size_bytes)}</p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E5E5EA]">
                  <button
                    onClick={() => handleDownload(file)}
                    className="text-xs text-[#0071E3] font-medium hover:underline inline-flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setShareTarget(file);
                        setGeneratedShareUrl(null);
                      }}
                      className="p-1 text-[#86868B] hover:text-[#0071E3]"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleTrash(file)}
                      className="p-1 text-[#86868B] hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {newFolderOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#E5E5EA]">
            <h3 className="text-base font-semibold text-[#1D1D1F] mb-4">Create New Folder</h3>
            <form onSubmit={handleCreateFolder}>
              <input
                type="text"
                autoFocus
                placeholder="Folder Name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-[#E5E5EA] rounded-xl focus:outline-none focus:border-[#0071E3] mb-4"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewFolderOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#6E6E73] hover:bg-[#F2F2F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-[#0071E3] text-white hover:bg-[#0077ED]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#E5E5EA]">
            <h3 className="text-base font-semibold text-[#1D1D1F] mb-4">Rename File</h3>
            <form onSubmit={handleRename}>
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-[#E5E5EA] rounded-xl focus:outline-none focus:border-[#0071E3] mb-4"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#6E6E73] hover:bg-[#F2F2F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-[#0071E3] text-white hover:bg-[#0077ED]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#E5E5EA]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#1D1D1F]">Share File</h3>
              <button onClick={() => setShareTarget(null)} className="text-[#86868B] hover:text-[#1D1D1F]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6E6E73] mb-4">
              Create a private, expiring share link for <span className="font-semibold text-[#1D1D1F]">{shareTarget.display_name}</span>.
            </p>

            {generatedShareUrl ? (
              <div className="space-y-4">
                <div className="p-3 bg-[#F2F2F7] rounded-xl border border-[#E5E5EA] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#1D1D1F] truncate mr-2">{generatedShareUrl}</span>
                  <button
                    onClick={copyShareLink}
                    className="inline-flex items-center space-x-1 text-xs text-[#0071E3] font-medium shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <button
                  onClick={() => setShareTarget(null)}
                  className="w-full py-2.5 rounded-xl bg-[#0071E3] text-white text-xs font-medium"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateShare} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1">
                    Password Protection (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave empty for no password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-[#E5E5EA] rounded-xl focus:outline-none focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1">
                    Expiration Duration
                  </label>
                  <select
                    value={shareHours}
                    onChange={(e) => setShareHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-[#E5E5EA] rounded-xl focus:outline-none focus:border-[#0071E3]"
                  >
                    <option value={1}>1 hour</option>
                    <option value={24}>24 hours (1 day)</option>
                    <option value={168}>7 days</option>
                    <option value={720}>30 days</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShareTarget(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-[#6E6E73] hover:bg-[#F2F2F7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-[#0071E3] text-white hover:bg-[#0077ED]"
                  >
                    Generate Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FileExplorerPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-[#86868B]">Loading files...</div>}>
      <FileExplorerContent />
    </Suspense>
  );
}
