"use client";

import React, { useState, useEffect } from "react";
import { Trash2, RotateCcw, AlertTriangle, FileText } from "lucide-react";
import { api, FileItem } from "@/lib/api";

export default function TrashPage() {
  const [trashedFiles, setTrashedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrash = async () => {
    try {
      const res = await api.listFiles({ is_trashed: true });
      setTrashedFiles(res);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const handleRestore = async (file: FileItem) => {
    try {
      await api.restoreFile(file.id);
      await loadTrash();
    } catch (err: any) {
      alert(`Could not restore: ${err.message}`);
    }
  };

  const handlePermanentDelete = async (file: FileItem) => {
    if (!confirm(`Permanently delete "${file.display_name}"? This will irreversibly erase the object and cannot be undone.`)) return;
    try {
      await api.permanentDeleteFile(file.id);
      await loadTrash();
    } catch (err: any) {
      alert(`Could not permanently delete: ${err.message}`);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm("Empty entire trash bin? All files in trash will be permanently erased.")) return;
    try {
      for (const f of trashedFiles) {
        await api.permanentDeleteFile(f.id);
      }
      await loadTrash();
    } catch (err: any) {
      alert(`Error emptying trash: ${err.message}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E5EA]">
        <div className="flex items-center space-x-2.5">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h1 className="text-xl font-semibold text-[#1D1D1F]">Trash Bin</h1>
        </div>

        {trashedFiles.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            Empty Trash
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-[#E5E5EA] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-16 text-center text-[#86868B]">Loading trash contents...</div>
        ) : trashedFiles.length === 0 ? (
          <div className="py-16 text-center text-[#86868B]">
            <Trash2 className="w-10 h-10 mx-auto mb-2 text-[#D1D1D6]" />
            <p className="text-sm font-medium">Trash is empty</p>
            <p className="text-xs mt-1">Deleted items remain in trash for 30 days before permanent purging.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5E5EA] text-xs font-medium text-[#86868B] bg-[#FAFAFA]">
                <th className="py-3 pl-4">Name</th>
                <th className="py-3">Size</th>
                <th className="py-3">Deleted Date</th>
                <th className="py-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA]">
              {trashedFiles.map((file) => (
                <tr key={file.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3 pl-4 flex items-center space-x-2.5 font-medium text-[#1D1D1F]">
                    <FileText className="w-4 h-4 text-[#86868B]" />
                    <span className="truncate max-w-sm line-through text-[#86868B]">{file.display_name}</span>
                  </td>
                  <td className="py-3 text-xs text-[#6E6E73]">{formatBytes(file.size_bytes)}</td>
                  <td className="py-3 text-xs text-[#6E6E73]">
                    {file.trashed_at ? new Date(file.trashed_at).toLocaleDateString() : "Recently"}
                  </td>
                  <td className="py-3 text-right pr-4 space-x-2">
                    <button
                      onClick={() => handleRestore(file)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#0071E3] bg-blue-50 hover:bg-blue-100 transition-colors"
                      title="Restore file"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(file)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      title="Permanent delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Forever</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
