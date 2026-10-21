"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Cloud, Lock, Mail, ArrowRight, Fingerprint, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("alice@cloudora.io");
    setPassword("Password123!");
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
          <h2 className="text-2xl font-semibold text-[#1D1D1F]">Sign in to your space</h2>
          <p className="text-sm text-[#6E6E73] mt-1.5">Enter your email and password to access your files</p>
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
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="namee@xyz.com"
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
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5EA] text-sm text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-sm font-medium transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E5E5EA] space-y-3">
            <button
              type="button"
              onClick={() => setError("Passkey authentication requires registered WebAuthn credential in browser environment.")}
              className="w-full py-2.5 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-sm font-medium transition-all flex items-center justify-center space-x-2"
            >
              <Fingerprint className="w-4 h-4 text-[#0071E3]" />
              <span>Sign in with Passkey / Biometrics</span>
            </button>

            <button
              type="button"
              onClick={fillDemo}
              className="w-full py-2 text-xs text-[#6E6E73] hover:text-[#0071E3] transition-colors text-center"
            >
              Fill Demo Credentials (anuu@nubes.io)
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#6E6E73] mt-8">
          Don't have an ac yet 🤨?{" "}
          <Link href="/register" className="text-[#0071E3] font-medium hover:underline">
            Create your space 🧘🏻‍♂️
          </Link>
        </p>
      </div>
    </div>
  );
}
