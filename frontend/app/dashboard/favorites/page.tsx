"use client";

import React, { useState, useEffect } from "react";
import { Star, Download, FileText } from "lucide-react";
import { api, FileItem } from "@/lib/api";

export default function FavoritesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    try {
      const res = await api.listFiles({ is_favorite: true, is_trashed: false });
      setFiles(res);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDownload = async (file: FileItem) => {
    try {
      const intent = await api.getDownloadIntent(file.id);
      window.open(intent.download_url, "_blank");
    } catch (err: any) {
      alert(`Could not download: ${err.message}`);
    }
  };

  const handleUnfavorite = async (file: FileItem) => {
    try {
      await api.patchFile(file.id, { is_favorite: false });
      await loadFiles();
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-2.5 pb-4 border-b border-[#E5E5EA]">
        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
        <h1 className="text-xl font-semibold text-[#1D1D1F]">Favorites</h1>
      </div>

      <div className="rounded-2xl bg-white border border-[#E5E5EA] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-16 text-center text-[#86868B]">Loading favorites...</div>
        ) : files.length === 0 ? (
          <div className="py-16 text-center text-[#86868B]">
            <Star className="w-10 h-10 mx-auto mb-2 text-[#D1D1D6]" />
            <p className="text-sm font-medium">No favorite files</p>
            <p className="text-xs mt-1">Click the star icon on any file in your workspace to bookmark it here.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5E5EA] text-xs font-medium text-[#86868B] bg-[#FAFAFA]">
                <th className="py-3 pl-4">Name</th>
                <th className="py-3">Size</th>
                <th className="py-3">Starred Date</th>
                <th className="py-3 text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA]">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3 pl-4 flex items-center space-x-2.5 font-medium text-[#1D1D1F]">
                    <FileText className="w-4 h-4 text-[#0071E3]" />
                    <span className="truncate max-w-sm">{file.display_name}</span>
                  </td>
                  <td className="py-3 text-xs text-[#6E6E73]">{formatBytes(file.size_bytes)}</td>
                  <td className="py-3 text-xs text-[#6E6E73]">{new Date(file.updated_at).toLocaleDateString()}</td>
                  <td className="py-3 text-right pr-4 space-x-2">
                    <button
                      onClick={() => handleUnfavorite(file)}
                      className="p-1.5 rounded-lg text-amber-500 hover:text-gray-400 transition-colors"
                      title="Unfavorite"
                    >
                      <Star className="w-4 h-4 fill-amber-500" />
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1.5 rounded-lg text-[#86868B] hover:text-[#0071E3] transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
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
