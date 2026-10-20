"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Cloud, Lock, Download, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { api, FileItem } from "@/lib/api";

function PublicShareContent() {
  const params = useParams();
  const token = params.token as string;

  const [shareData, setShareData] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShare = async (pwd?: string) => {
    setError(null);
    try {
      const res = await api.getPublicShare(token, pwd);
      setShareData(res);
    } catch (err: any) {
      setError(err.message || "Unable to access share");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchShare();
    }
  }, [token]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    fetchShare(password);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAFAFA] text-[#1D1D1F]">
      {/* Header */}
      <header className="h-16 apple-blur border-b border-[#E5E5EA] flex items-center justify-between px-6">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0071E3] flex items-center justify-center text-white shadow-sm">
            <Cloud className="w-4 h-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Cloudora</span>
        </Link>
        <div className="text-xs text-[#86868B] bg-[#F2F2F7] px-3 py-1 rounded-full">
          Secure Shared Link
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {loading ? (
            <div className="text-center py-12 text-[#86868B]">
              <div className="w-8 h-8 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Verifying share link permissions...</p>
            </div>
          ) : error ? (
            <div className="p-8 rounded-2xl bg-white border border-[#E5E5EA] shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#1D1D1F]">Link Unavailable</h3>
              <p className="text-sm text-[#6E6E73]">{error}</p>
              <Link
                href="/"
                className="inline-block mt-4 px-6 py-2.5 rounded-full bg-[#0071E3] text-white text-xs font-medium"
              >
                Go to Cloudora Home
              </Link>
            </div>
          ) : shareData?.requires_password ? (
            /* Password Challenge */
            <div className="p-8 rounded-2xl bg-white border border-[#E5E5EA] shadow-sm space-y-5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-[#1D1D1F]">Password Protected</h3>
                <p className="text-xs text-[#6E6E73] mt-1">
                  This shared link requires a password to view and download.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <input
                  type="password"
                  required
                  placeholder="Enter link password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E5E5EA] rounded-xl focus:outline-none focus:border-[#0071E3]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium transition-colors"
                >
                  Unlock Access
                </button>
              </form>
            </div>
          ) : (
            /* File Available */
            <div className="p-8 rounded-2xl bg-white border border-[#E5E5EA] shadow-sm text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0071E3] flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1D1D1F] truncate">
                  {shareData.file?.display_name || "Shared File"}
                </h3>
                <p className="text-xs text-[#6E6E73] mt-1">
                  {formatBytes(shareData.file?.size_bytes || 0)} • Verified Private File
                </p>
              </div>

              {shareData.download_url && (
                <a
                  href={shareData.download_url}
                  download
                  className="inline-flex items-center justify-center space-x-2 w-full py-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-sm font-medium transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </a>
              )}

              <div className="pt-4 border-t border-[#E5E5EA] text-xs text-[#86868B] flex items-center justify-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted delivery via Cloudora Secure Transport</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 border-t border-[#E5E5EA] flex items-center justify-center text-xs text-[#86868B]">
        <span>Powered by Cloudora &bull; Your digital world. One beautiful, secure space.</span>
      </footer>
    </div>
  );
}

export default function PublicSharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-[#86868B]">Loading share...</div>}>
      <PublicShareContent />
    </Suspense>
  );
}
