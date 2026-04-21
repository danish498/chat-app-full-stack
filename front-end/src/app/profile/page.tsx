"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Calendar,
  Clock,
  Edit2,
  Shield,
  Camera,
  LogOut,
} from "lucide-react";
import authService, { User } from "@/services/auth.service";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Try getting from local storage first for immediate display
        const localUser = authService.getCurrentUser();
        if (localUser) {
          setUser(localUser);
        }

        // Fetch fresh data from API
        const freshUser = await authService.getProfile();
        setUser(freshUser);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (!authService.getCurrentUser()) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await authService.logout();
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00A699]/30 border-t-[#00A699] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-[#00A699]/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#00A699]/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Chat</span>
          </Link>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Left Column - Avatar & Core Info */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-1 space-y-6"
          >
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-[#00A699]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-zinc-800 overflow-hidden bg-zinc-800 flex items-center justify-center">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-zinc-400">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2.5 bg-[#00A699] hover:bg-[#00cebd] text-white rounded-full shadow-lg transition-colors transform hover:scale-105 active:scale-95">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-2xl font-bold text-white mb-1">
                {user.displayName}
              </h2>
              <p className="text-[#00A699] font-medium mb-4">
                @{user.username}
              </p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </div>
            </div>

            {/* Quick Stats or Status */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                About
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {user.status || "Hey there! I am using Chat Hive."}
              </p>
            </div>
          </motion.div>

          {/* Right Column - Detailed Info */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 space-y-6"
          >
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#00A699]" />
                  Profile Details
                </h3>
                <Button
                  variant="outline"
                  className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700/50 text-zinc-200 gap-2 rounded-xl"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              </div>

              <div className="space-y-6">
                <div className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 p-4 rounded-2xl hover:bg-zinc-800/30 transition-colors border border-transparent hover:border-zinc-800/50">
                  <div className="flex items-center gap-3 sm:w-1/3 text-zinc-400">
                    <UserIcon className="w-5 h-5" />
                    <span className="font-medium">Display Name</span>
                  </div>
                  <div className="text-zinc-100 font-medium">
                    {user.displayName}
                  </div>
                </div>

                <div className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 p-4 rounded-2xl hover:bg-zinc-800/30 transition-colors border border-transparent hover:border-zinc-800/50">
                  <div className="flex items-center gap-3 sm:w-1/3 text-zinc-400">
                    <Mail className="w-5 h-5" />
                    <span className="font-medium">Email Address</span>
                  </div>
                  <div className="text-zinc-100 font-medium">{user.email}</div>
                </div>

                <div className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 p-4 rounded-2xl hover:bg-zinc-800/30 transition-colors border border-transparent hover:border-zinc-800/50">
                  <div className="flex items-center gap-3 sm:w-1/3 text-zinc-400">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">Joined Date</span>
                  </div>
                  <div className="text-zinc-100 font-medium">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 p-4 rounded-2xl hover:bg-zinc-800/30 transition-colors border border-transparent hover:border-zinc-800/50">
                  <div className="flex items-center gap-3 sm:w-1/3 text-zinc-400">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Last Seen</span>
                  </div>
                  <div className="text-zinc-100 font-medium">
                    {user.lastSeen
                      ? new Date(user.lastSeen).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently"}
                  </div>
                </div>
              </div>
            </div>

            {/* Security or Preferences snippet */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 flex items-center justify-between">
              <div>
                <h4 className="text-white font-semibold mb-1">
                  End-to-End Encryption
                </h4>
                <p className="text-sm text-zinc-400">
                  Your messages are secured with your device keys.
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
