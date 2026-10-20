"use client";

import React, { useState } from "react";
import { Settings, ShieldCheck, Lock, User, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/lib/api";

export default function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (newPassword !== confirmPassword) {
      setMsg({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setMsg({ type: "error", text: "Password must be at least 8 characters long" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("cloudora_token");
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail?.message || err.detail || "Failed to update password");
      }

      setMsg({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-2.5 pb-4 border-b border-[#E5E5EA]">
        <Settings className="w-5 h-5 text-[#0071E3]" />
        <h1 className="text-xl font-semibold text-[#1D1D1F]">Account & Security Settings</h1>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm flex items-center space-x-2.5 ${
          msg.type === "success" 
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800" 
            : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Profile Overview */}
      <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-semibold text-[#1D1D1F] flex items-center space-x-2">
          <User className="w-4 h-4 text-[#0071E3]" />
          <span>Profile Information</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 bg-[#FAFAFA] rounded-xl border border-[#E5E5EA]">
            <span className="text-xs text-[#86868B] uppercase tracking-wider font-semibold">Full Name</span>
            <div className="text-sm font-medium text-[#1D1D1F] mt-1">{user?.full_name}</div>
          </div>
          <div className="p-3.5 bg-[#FAFAFA] rounded-xl border border-[#E5E5EA]">
            <span className="text-xs text-[#86868B] uppercase tracking-wider font-semibold">Email Address</span>
            <div className="text-sm font-medium text-[#1D1D1F] mt-1">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-semibold text-[#1D1D1F] flex items-center space-x-2">
          <KeyRound className="w-4 h-4 text-[#0071E3]" />
          <span>Update Password</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-[#E5E5EA] rounded-xl focus:outline-none focus:border-[#0071E3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-[#E5E5EA] rounded-xl focus:outline-none focus:border-[#0071E3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-[#E5E5EA] rounded-xl focus:outline-none focus:border-[#0071E3]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium transition-all shadow-2xs disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Security Architecture Summary */}
      <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-semibold text-[#1D1D1F] flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Active Security Protections</span>
        </h3>

        <div className="space-y-2 text-xs text-[#6E6E73]">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Passwords securely salted and hashed using standard bcrypt</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Short-lived HMAC JWT tokens (auto-revocation on password reset)</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Private-by-default cloud object storage bucket with signed URLs</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Strict security headers: nosniff, frame-ancestors DENY, CORS validation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
