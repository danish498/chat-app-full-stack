"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail, Lock, ArrowRight } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import authService from "@/services/auth.service";
import { apiFetch, setAccessToken } from "@/lib/apiClient";
import { generateAndStoreKeyPair, idbGet } from "@/lib/e2ee";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError("");

  //   try {
  //     const response = await authService.login(formData.email, formData.password);

  //     if (response.data.accessToken) {
  //       // Tokens are handled by authService (localStorage)
  //       router.push("/");
  //     } else {
  //       throw new Error("Invalid response from server");
  //     }
  //   } catch (err: any) {
  //     setError(err.response?.data?.message || err.message || "Something went wrong");
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.login(formData.email, formData.password);

      if (response.data.accessToken) {
        // ── CHANGE 1: store token in memory, not localStorage ──
        setAccessToken(response.data.accessToken);

        // ── CHANGE 2: check if this device already has a key ──
        const userId = response.data.user.id; // adjust to match your response shape
        const existingKey = await idbGet(`privateKey:${userId}`);

        if (!existingKey) {
          // New device or cleared browser — regenerate and re-upload public key
          await generateAndStoreKeyPair(userId, apiFetch);
        }

        router.push("/");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to Chat Hive."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-semibold text-zinc-300 ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#00A699] transition-colors" />
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-3.5 pl-11 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00A699]/30 focus:border-[#00A699]/50 transition-all font-medium"
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-semibold text-zinc-300">Password</label>
            <Link href="#" className="text-xs text-[#00A699] hover:text-[#00cebd] font-bold transition-colors">Forgot?</Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#00A699] transition-colors" />
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-3.5 pl-11 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00A699]/30 focus:border-[#00A699]/50 transition-all font-medium"
              onChange={handleChange}
            />
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="text-red-400 text-sm font-medium bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-center"
          >
            {error}
          </motion.div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00A699] hover:bg-[#00cebd] text-white font-bold py-7 rounded-xl shadow-lg shadow-[#00A699]/20 transition-all active:scale-[0.98] text-lg group"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-top-white rounded-full animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Log In</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </Button>
      </form>

      <div className="mt-12 text-center">
        <p className="text-zinc-500 font-medium">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#00A699] hover:text-[#00cebd] font-bold transition-colors">
            Create Account
          </Link>
        </p>
      </div>

    </AuthLayout>
  );
}

