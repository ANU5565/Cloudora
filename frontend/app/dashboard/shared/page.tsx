"use client";

import React, { useState, useEffect } from "react";
import { Share2, Trash2, Lock, Clock, Copy, Check } from "lucide-react";
import { api, ShareItem } from "@/lib/api";

export default function SharedLinksPage() {
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadShares = async () => {
    try {
      const res = await api.listShares();
      setShares(res);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShares();
  }, []);

  const handleRevoke = async (shareId: string) => {
    if (!confirm("Revoke this share link? Anyone with this URL will lose access immediately.")) return;
    try {
      await api.revokeShare(shareId);
      await loadShares();
    } catch (err: any) {
      alert(`Could not revoke: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-2.5 pb-4 border-b border-[#E5E5EA]">
        <Share2 className="w-5 h-5 text-[#0071E3]" />
        <h1 className="text-xl font-semibold text-[#1D1D1F]">Shared Links</h1>
      </div>

      <div className="rounded-2xl bg-white border border-[#E5E5EA] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-16 text-center text-[#86868B]">Loading active share links...</div>
        ) : shares.length === 0 ? (
          <div className="py-16 text-center text-[#86868B]">
            <Share2 className="w-10 h-10 mx-auto mb-2 text-[#D1D1D6]" />
            <p className="text-sm font-medium">No active share links</p>
            <p className="text-xs mt-1">Select any file in My Files and click Share to create private expiring links.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5E5EA] text-xs font-medium text-[#86868B] bg-[#FAFAFA]">
                <th className="py-3 pl-4">Target Resource</th>
                <th className="py-3">Access Policy</th>
                <th className="py-3">Protection</th>
                <th className="py-3">Expires At</th>
                <th className="py-3 text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA]">
              {shares.map((share) => (
                <tr key={share.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3 pl-4 font-mono text-xs text-[#1D1D1F]">
                    {share.file_id ? `File #${share.file_id.slice(0, 8)}...` : `Folder #${share.folder_id?.slice(0, 8)}...`}
                  </td>
                  <td className="py-3 text-xs text-[#6E6E73] capitalize">{share.access_policy}</td>
                  <td className="py-3 text-xs">
                    {share.has_password ? (
                      <span className="inline-flex items-center text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] font-medium">
                        <Lock className="w-3 h-3 mr-1" /> Password Protected
                      </span>
                    ) : (
                      <span className="text-[#86868B]">Direct Link</span>
                    )}
                  </td>
                  <td className="py-3 text-xs text-[#6E6E73]">
                    {share.expires_at ? new Date(share.expires_at).toLocaleString() : "Never"}
                  </td>
                  <td className="py-3 text-right pr-4">
                    <button
                      onClick={() => handleRevoke(share.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      Revoke Access
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
