"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
      localStorage.setItem("cloudora_user", JSON.stringify(u));
    } catch {
      setUser(null);
      api.logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("cloudora_user");
    const token = localStorage.getItem("cloudora_token");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        refreshUser();
      } catch {
        refreshUser();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (data: any) => {
    const res = await api.login(data);
    setUser(res.user);
    router.push("/dashboard");
  };

  const register = async (data: any) => {
    await api.register(data);
    // After registration, log in
    await login({ email: data.email, password: data.password });
  };

  const logout = () => {
    api.logout();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
