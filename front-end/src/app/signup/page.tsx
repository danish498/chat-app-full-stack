"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Lock,
  User,
  Link as LucideLink,
  Terminal,
  ArrowRight,
} from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import authService from "@/services/auth.service";
import { apiFetch, setAccessToken } from "@/lib/apiClient";
import { generateAndStoreKeyPair, backupPrivateKey } from "@/lib/e2ee";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ── CHANGE 1: capture the response ──
      const response = await authService.signup(formData);

      // ── CHANGE 2: store token + generate E2EE keypair ──
      const { accessToken, user } = response.data; // adjust to match your response shape
      setAccessToken(accessToken);

      await generateAndStoreKeyPair(user.id, apiFetch);
      await backupPrivateKey(user.id, formData.password, apiFetch);
      //    ↑ THIS is where IndexedDB gets created for the first time
      //      and the private key is stored + public key uploaded to server

      router.push("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join Chat Hive today. Experience the speed."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300 ml-1">
              Username
            </label>
            <div className="relative group">
              <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#00A699] transition-colors" />
              <input
                type="text"
                name="username"
                required
                placeholder="johndoe"
                className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00A699]/30 transition-all font-medium"
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300 ml-1">
              Display Name
            </label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#00A699] transition-colors" />
              <input
                type="text"
                name="displayName"
                required
                placeholder="John Doe"
                className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00A699]/30 transition-all font-medium"
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-300 ml-1">
            Email
          </label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#00A699] transition-colors" />
            <input
              type="email"
              name="email"
              required
              placeholder="john@example.com"
              className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00A699]/30 transition-all font-medium"
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-300 ml-1">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#00A699] transition-colors" />
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00A699]/30 transition-all font-medium"
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-300 ml-1">
            Avatar URL (Optional)
          </label>
          <div className="relative group">
            <LucideLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#00A699] transition-colors" />
            <input
              type="text"
              name="avatarUrl"
              placeholder="https://..."
              className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00A699]/30 transition-all font-medium"
              onChange={handleChange}
            />
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-xs font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center"
          >
            {error}
          </motion.div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00A699] hover:bg-[#00cebd] text-white font-bold py-6 rounded-xl shadow-lg shadow-[#00A699]/20 transition-all active:scale-[0.98] group mt-2"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-top-white rounded-full animate-spin" />
              <span>Creating account...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Sign Up</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </Button>
      </form>

      <div className="mt-8 text-center border-t border-zinc-900 pt-8">
        <p className="text-zinc-500 font-medium text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#00A699] hover:text-[#00cebd] font-bold transition-colors"
          >
            Log In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
