"use client";

import React, { useState, useEffect } from "react";
import { HardDrive, PieChart, FileText, Download } from "lucide-react";
import { api, StorageStats, FileItem } from "@/lib/api";

export default function StorageAnalyticsPage() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStorageStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const intent = await api.getDownloadIntent(file.id);
      window.open(intent.download_url, "_blank");
    } catch (err: any) {
      alert(`Could not download: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center space-x-2.5 pb-4 border-b border-[#E5E5EA]">
        <HardDrive className="w-5 h-5 text-[#0071E3]" />
        <h1 className="text-xl font-semibold text-[#1D1D1F]">Authoritative Storage Analytics</h1>
      </div>

      {loading || !stats ? (
        <div className="py-16 text-center text-[#86868B]">Calculating authoritative storage usage...</div>
      ) : (
        <>
          {/* Main Storage Card */}
          <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#86868B] font-medium uppercase tracking-wider">Total Quota Allocation</span>
                <div className="text-3xl font-bold text-[#1D1D1F] mt-1">
                  {formatBytes(stats.used_bytes)} <span className="text-base font-normal text-[#6E6E73]">used of {formatBytes(stats.quota_bytes)}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#86868B] font-medium uppercase tracking-wider">Remaining Available</span>
                <div className="text-xl font-semibold text-emerald-600 mt-1">
                  {formatBytes(stats.remaining_bytes)} free
                </div>
              </div>
            </div>

            {/* Visual Storage Meter */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-[#F2F2F7] rounded-full overflow-hidden flex">
                <div 
                  className="bg-[#0071E3] h-full" 
                  style={{ width: `${Math.min(stats.used_percent, 100)}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs text-[#86868B]">
                <span>0 B</span>
                <span>{stats.used_percent}% utilized</span>
                <span>{formatBytes(stats.quota_bytes)}</span>
              </div>
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(stats.by_category).map(([cat, bytes]) => (
              <div key={cat} className="p-4 rounded-xl bg-white border border-[#E5E5EA] shadow-2xs">
                <span className="text-xs font-medium text-[#6E6E73] capitalize">{cat}</span>
                <div className="text-base font-semibold text-[#1D1D1F] mt-1">{formatBytes(bytes)}</div>
              </div>
            ))}
          </div>

          {/* Largest Files Table */}
          <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6 shadow-2xs">
            <h3 className="text-base font-semibold text-[#1D1D1F] mb-4">Largest Files Consuming Space</h3>
            {stats.largest_files.length === 0 ? (
              <p className="text-xs text-[#86868B]">No files stored in your account yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E5EA] text-xs font-medium text-[#86868B]">
                      <th className="pb-3 pl-2">Filename</th>
                      <th className="pb-3">Size</th>
                      <th className="pb-3">Created</th>
                      <th className="pb-3 text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA]">
                    {stats.largest_files.map((f) => (
                      <tr key={f.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="py-3 pl-2 flex items-center space-x-2 font-medium text-[#1D1D1F]">
                          <FileText className="w-4 h-4 text-[#0071E3]" />
                          <span className="truncate max-w-sm">{f.display_name}</span>
                        </td>
                        <td className="py-3 text-xs text-[#6E6E73]">{formatBytes(f.size_bytes)}</td>
                        <td className="py-3 text-xs text-[#6E6E73]">{new Date(f.created_at).toLocaleDateString()}</td>
                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={() => handleDownload(f)}
                            className="p-1 text-[#86868B] hover:text-[#0071E3]"
                            title="Download"
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
        </>
      )}
    </div>
  );
}
