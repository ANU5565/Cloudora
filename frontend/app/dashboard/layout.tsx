"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Cloud, 
  LayoutDashboard, 
  Folder, 
  Clock, 
  Star, 
  Share2, 
  Trash2, 
  HardDrive, 
  Settings, 
  LogOut, 
  Upload, 
  FolderPlus, 
  Search, 
  Menu, 
  X,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, StorageStats } from "@/lib/api";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Files", href: "/dashboard/files", icon: Folder },
  { label: "Recent", href: "/dashboard/recent", icon: Clock },
  { label: "Favorites", href: "/dashboard/favorites", icon: Star },
  { label: "Shared Links", href: "/dashboard/shared", icon: Share2 },
  { label: "Trash", href: "/dashboard/trash", icon: Trash2 },
  { label: "Storage", href: "/dashboard/storage", icon: HardDrive },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<StorageStats | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      api.getStorageStats().then(setStats).catch(() => {});
    }
  }, [user, pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#6E6E73] font-medium tracking-wide">Loading Cloudora...</span>
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[#E5E5EA] bg-[#FFFFFF] p-4 shrink-0">
        <div>
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2.5 px-3 py-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[#0071E3] flex items-center justify-center text-white shadow-sm">
              <Cloud className="w-4 h-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Cloudora</span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#F2F2F7] text-[#0071E3] font-semibold"
                      : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#FAFAFA]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#0071E3]" : "text-[#86868B]"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Storage Meter & User Profile */}
        <div className="pt-4 border-t border-[#E5E5EA] space-y-4">
          <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5EA]">
            <div className="flex items-center justify-between text-xs text-[#6E6E73] mb-1.5 font-medium">
              <span>Storage Used</span>
              <span>{stats ? `${stats.used_percent}%` : "0%"}</span>
            </div>
            <div className="w-full h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0071E3] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(stats ? stats.used_percent : 0, 100)}%` }}
              />
            </div>
            <div className="text-xs text-[#86868B] mt-1.5">
              {stats ? formatBytes(stats.used_bytes) : "0 B"} of {stats ? formatBytes(stats.quota_bytes) : "5 GB"}
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#F2F2F7] border border-[#E5E5EA] flex items-center justify-center font-medium text-xs text-[#1D1D1F] shrink-0">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-[#1D1D1F] truncate">{user.full_name}</p>
                <p className="text-[11px] text-[#86868B] truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#86868B] hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 apple-blur border-b border-[#E5E5EA] flex items-center justify-between px-6 shrink-0 z-30">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#1D1D1F] hover:bg-[#F2F2F7]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="relative hidden sm:block w-72">
              <Search className="w-4 h-4 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files and folders..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    router.push(`/dashboard/files?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
                  }
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F2F2F7] border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-[#0071E3] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard/files?action=new-folder"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5EA] bg-white text-xs font-medium text-[#1D1D1F] hover:bg-[#F2F2F7] transition-colors shadow-2xs"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>New Folder</span>
            </Link>
            <Link
              href="/dashboard/files?action=upload"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </Link>
          </div>
        </header>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#E5E5EA] bg-white p-4 space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium ${
                  pathname === item.href ? "bg-[#F2F2F7] text-[#0071E3]" : "text-[#6E6E73]"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Main Workspace Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
