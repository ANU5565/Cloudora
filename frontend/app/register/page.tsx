"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Cloud, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the terms of service and privacy policy");
      return;
    }

    setLoading(true);

    try {
      await register({
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword,
        terms_accepted: termsAccepted,
      });
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-[#FAFAFA]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#0071E3] flex items-center justify-center text-white shadow-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">Nubes</span>
          </Link>
          <h2 className="text-2xl font-semibold text-[#1D1D1F]">Create your personal space</h2>
          <p className="text-sm text-[#6E6E73] mt-1.5">5 GB high-speed private cloud storage included free</p>
        </div>

        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5EA] text-sm text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5EA] text-sm text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5EA] text-sm text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5EA] text-sm text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] transition-colors"
                />
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 rounded text-[#0071E3] focus:ring-0"
              />
              <label htmlFor="terms" className="text-xs text-[#6E6E73] leading-normal">
                I agree to the Nubes Terms of Service and acknowledge the privacy-by-default architecture policy.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-sm font-medium transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
            >
              <span>{loading ? "Creating Space..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6E6E73] mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-[#0071E3] font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
