import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Cloudora — Your digital world. One beautiful, secure space.",
  description: "A modern, privacy-focused cloud storage platform inspired by simplicity, elegance, and unyielding security.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FAFAFA] text-[#1D1D1F]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
