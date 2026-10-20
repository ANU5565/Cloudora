"use client";

import Link from "next/link";
import { 
  Cloud, 
  ShieldCheck, 
  FolderLock, 
  Share2, 
  HardDrive, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  KeyRound, 
  Cpu, 
  Sparkles 
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#1D1D1F]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 apple-blur border-b border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#0071E3] flex items-center justify-center text-white shadow-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Cloudora</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#6E6E73]">
            <a href="#features" className="hover:text-[#1D1D1F] transition-colors">Features</a>
            <a href="#security" className="hover:text-[#1D1D1F] transition-colors">Security</a>
            <a href="#storage" className="hover:text-[#1D1D1F] transition-colors">Storage</a>
            <a href="#pricing" className="hover:text-[#1D1D1F] transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-[#1D1D1F] hover:text-[#0071E3] transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="text-sm font-medium bg-[#0071E3] hover:bg-[#0077ED] text-white px-4 py-2 rounded-full transition-all shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F2F2F7] border border-[#E5E5EA] text-xs font-medium text-[#6E6E73] mb-8">
          <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
          <span>The Next Generation of Private Cloud Storage</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#1D1D1F] leading-tight mb-6">
          Everything you need to keep.<br className="hidden sm:inline" /> Beautifully organized.
        </h1>

        <p className="text-lg sm:text-xl text-[#6E6E73] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Your files, photos, documents, and ideas in one private space. Access what matters from anywhere, with zero compromise on privacy.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#0071E3] text-white text-base font-medium hover:bg-[#0077ED] transition-all shadow-sm"
          >
            Create your space
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#FFFFFF] border border-[#E5E5EA] text-[#1D1D1F] text-base font-medium hover:bg-[#F2F2F7] transition-all"
          >
            Explore features
          </a>
        </div>

        {/* Realistic Apple-inspired UI preview */}
        <div className="relative mx-auto rounded-2xl border border-[#E5E5EA] bg-[#FFFFFF] shadow-xl overflow-hidden p-3 text-left">
          <div className="flex items-center justify-between pb-3 px-3 border-b border-[#E5E5EA]">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              <span className="text-xs text-[#86868B] ml-2">Cloudora Workspace</span>
            </div>
            <div className="text-xs text-[#86868B] bg-[#F2F2F7] px-3 py-1 rounded-md">
              Encrypted Private Storage
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
            <div className="border border-[#E5E5EA] rounded-xl p-4 bg-[#FAFAFA]">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-[#0071E3] mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold truncate">Q3_Financial_Brief.pdf</h4>
              <p className="text-xs text-[#86868B] mt-1">2.4 MB • Verified</p>
            </div>

            <div className="border border-[#E5E5EA] rounded-xl p-4 bg-[#FAFAFA]">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold truncate">Architecture_Mockup.png</h4>
              <p className="text-xs text-[#86868B] mt-1">14.8 MB • Encrypted</p>
            </div>

            <div className="border border-[#E5E5EA] rounded-xl p-4 bg-[#FAFAFA]">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-3">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold truncate">Keynote_Launch.mp4</h4>
              <p className="text-xs text-[#86868B] mt-1">182.1 MB • Streamable</p>
            </div>

            <div className="border border-[#E5E5EA] rounded-xl p-4 bg-[#FAFAFA]">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold truncate">source_bundle.zip</h4>
              <p className="text-xs text-[#86868B] mt-1">45.0 MB • Verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-6 bg-[#FFFFFF] border-y border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              Designed with precision. Engineered for privacy.
            </h2>
            <p className="text-[#6E6E73] text-base">
              Every detail has been crafted to provide an effortless experience that keeps your digital life secure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#0071E3] mb-5 shadow-sm">
                <FolderLock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Files organized your way</h3>
              <p className="text-sm text-[#6E6E73] leading-relaxed">
                Create structured folder hierarchies, navigate with interactive breadcrumbs, and protect against accidental folder cycles.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#0071E3] mb-5 shadow-sm">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure authentication</h3>
              <p className="text-sm text-[#6E6E73] leading-relaxed">
                Industry-standard bcrypt hashing, short-lived JWT tokens, session invalidation, and native passkey compatibility.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#0071E3] mb-5 shadow-sm">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Private sharing</h3>
              <p className="text-sm text-[#6E6E73] leading-relaxed">
                Generate cryptographic share links with optional password protection, custom expiration times, and instant one-click revocation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#0071E3] mb-5 shadow-sm">
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Storage that grows with you</h3>
              <p className="text-sm text-[#6E6E73] leading-relaxed">
                High-throughput object storage (Cloudflare R2 & AWS S3) decoupled from web servers for unlimited, independent scale.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#0071E3] mb-5 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Authoritative quota tracking</h3>
              <p className="text-sm text-[#6E6E73] leading-relaxed">
                Zero client-side trust. Real-time atomic quota reservations prevent upload collisions and protect service availability.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA]">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-center text-[#0071E3] mb-5 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Tenant isolation</h3>
              <p className="text-sm text-[#6E6E73] leading-relaxed">
                Comprehensive IDOR defenses ensure no user can ever access, modify, or download another user's private data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 px-6 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 mb-4">
              <Lock className="w-3.5 h-3.5" />
              <span>Strict Security Engineering</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              Privacy by design. Security by default.
            </h2>
            <p className="text-[#6E6E73] text-base">
              Here is an honest breakdown of the security controls actively implemented in Cloudora.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
              <h4 className="font-semibold text-base mb-1">Private-by-Default Buckets</h4>
              <p className="text-sm text-[#6E6E73]">
                Files are kept in private object storage. No permanent public URLs exist; downloads and uploads are authorized strictly through short-lived presigned URLs.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
              <h4 className="font-semibold text-base mb-1">Encrypted Transport & Headers</h4>
              <p className="text-sm text-[#6E6E73]">
                Strict HTTPS enforcement, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, and restricted CORS prevent cross-site scripting and unauthorized embedding.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
              <h4 className="font-semibold text-base mb-1">Cryptographic Token Hashing</h4>
              <p className="text-sm text-[#6E6E73]">
                Share tokens are generated using cryptographically secure random sources and persisted only as SHA-256 hashes, preventing token recovery from database dumps.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
              <h4 className="font-semibold text-base mb-1">Structured Logs with Redaction</h4>
              <p className="text-sm text-[#6E6E73]">
                All log events are serialized in JSON with sensitive fields like passwords, bearer tokens, cookies, and keys automatically redacted before output.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Tiers Section */}
      <section id="pricing" className="py-24 px-6 bg-white border-t border-[#E5E5EA]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Clear, transparent storage plans
          </h2>
          <p className="text-[#6E6E73] text-base max-w-xl mx-auto mb-16">
            Cloudora does not promise deceptive "unlimited" storage. Every plan comes with authoritative quota transparency.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-8 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA] flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Starter</h3>
                <p className="text-sm text-[#6E6E73] mb-6">Default plan for new personal accounts</p>
                <div className="text-3xl font-bold mb-6">5 GB <span className="text-sm font-normal text-[#6E6E73]">/ free</span></div>
                <ul className="space-y-3 text-sm text-[#6E6E73] mb-8">
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0071E3] mr-2" /> 5 GB High-Speed Quota</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0071E3] mr-2" /> 250 MB per file limit</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0071E3] mr-2" /> Private Share Links</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0071E3] mr-2" /> 30-Day Trash Retention</li>
                </ul>
              </div>
              <Link href="/register" className="w-full py-2.5 rounded-full bg-white border border-[#E5E5EA] text-[#1D1D1F] text-center font-medium hover:bg-[#F2F2F7] transition-all">
                Get Started
              </Link>
            </div>

            <div className="p-8 rounded-2xl bg-white border-2 border-[#0071E3] shadow-md flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0071E3] text-white text-xs font-semibold px-3 py-1 rounded-full">
                Popular
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Pro Workspace</h3>
                <p className="text-sm text-[#6E6E73] mb-6">For creators, photographers & developers</p>
                <div className="text-3xl font-bold mb-6">200 GB <span className="text-sm font-normal text-[#6E6E73]">/ proposed</span></div>
                <ul className="space-y-3 text-sm text-[#6E6E73] mb-8">
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0071E3] mr-2" /> 200 GB High-Speed Quota</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0071E3] mr-2" /> 5 GB per file limit</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0071E3] mr-2" /> Password-Protected Shares</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0071E3] mr-2" /> Detailed Audit History</li>
                </ul>
              </div>
              <Link href="/register" className="w-full py-2.5 rounded-full bg-[#0071E3] text-white text-center font-medium hover:bg-[#0077ED] transition-all">
                Create Space
              </Link>
            </div>

            <div className="p-8 rounded-2xl bg-[#FAFAFA] border border-[#E5E5EA] flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                <p className="text-sm text-[#6E6E73] mb-6">For teams with custom infrastructure</p>
                <div className="text-3xl font-bold mb-6">Custom <span className="text-sm font-normal text-[#6E6E73]">/ scalable</span></div>
                <ul className="space-y-3 text-sm text-[#6E6E73] mb-8">
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0071E3] mr-2" /> Custom Storage Buckets</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0071E3] mr-2" /> Dedicated S3/R2 Credentials</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0071E3] mr-2" /> Custom Retention Policies</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-[#0071E3] mr-2" /> SSO & WebAuthn Integration</li>
                </ul>
              </div>
              <Link href="/register" className="w-full py-2.5 rounded-full bg-white border border-[#E5E5EA] text-[#1D1D1F] text-center font-medium hover:bg-[#F2F2F7] transition-all">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 bg-[#FAFAFA] border-t border-[#E5E5EA] text-sm text-[#6E6E73]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-[#0071E3] flex items-center justify-center text-white">
              <Cloud className="w-4 h-4" />
            </div>
            <span className="font-semibold text-[#1D1D1F]">Cloudora</span>
            <span>— Your digital world. One beautiful, secure space.</span>
          </div>

          <div className="flex items-center space-x-6">
            <a href="#security" className="hover:text-[#1D1D1F]">Security</a>
            <a href="#features" className="hover:text-[#1D1D1F]">Features</a>
            <Link href="/login" className="hover:text-[#1D1D1F]">Sign In</Link>
            <Link href="/register" className="hover:text-[#1D1D1F]">Get Started</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-[#E5E5EA] text-xs text-[#86868B] flex flex-col sm:flex-row justify-between">
          <span>&copy; 2026 Cloudora Platform. Open-source, privacy-first cloud storage architecture.</span>
          <span className="mt-2 sm:mt-0">Designed inspired by Apple and Google Drive simplicity.</span>
        </div>
      </footer>
    </div>
  );
}
