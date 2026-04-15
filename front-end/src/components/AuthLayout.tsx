"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Terminal, MessageSquare, ShieldCheck, Zap } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="dark flex min-h-screen bg-[#14171A] text-white selection:bg-[#002f2b] overflow-hidden relative">
      {/* Background radial glows for the entire page to soften the dark tone */}
      <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-[#00A699]/10 rounded-full blur-[140px] pointer-events-none opacity-40" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-[#00A699]/10 rounded-full blur-[140px] pointer-events-none opacity-40" />

      {/* Left Decorative Side - Hidden on Mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-950/20 border-r border-white/5">
        <div className="absolute inset-0 z-0 opacity-40 grayscale-[20%] brightness-75">
          <Image
            src="/auth-banner.png"
            alt="Auth Banner"
            fill
            className="object-cover scale-105"
            priority
          />
        </div>

        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#14171A] via-transparent to-[#00A699]/5 z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-[#14171A] z-10" />

        {/* Content */}
        <div className="relative z-20 w-full h-full p-16 flex flex-col justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-[#00A699] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,166,153,0.3)]">
              <Terminal className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              Chat Hive
            </span>
          </motion.div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-6xl font-extrabold leading-[1.1] tracking-tight mb-4">
                Connect with the <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00A699] via-[#00cebd] to-[#00A699] animate-gradient-x">
                  Future of Messaging.
                </span>
              </h1>
              <p className="text-zinc-400 text-xl max-w-md font-medium leading-relaxed">
                Experience real-time collaboration with unprecedented speed and security.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="grid grid-cols-2 gap-6"
            >
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-10 h-10 rounded-full bg-[#00A699]/10 flex items-center justify-center text-[#00A699]">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Ultra Fast</p>
                  <p className="text-xs text-zinc-500">Real-time delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-10 h-10 rounded-full bg-[#00A699]/10 flex items-center justify-center text-[#00cebd]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Encrypted</p>
                  <p className="text-xs text-zinc-500">End-to-end secure</p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-zinc-500 text-sm font-medium"
          >
            © 2026 Chat Hive. All rights reserved.
          </motion.div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-[#00A699]/5 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-[#00A699]/5 rounded-full blur-[100px] -z-10 animate-pulse delay-700" />


        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col mb-10 lg:hidden"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Terminal className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">Chat Hive</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-4xl font-bold mb-2 tracking-tight">{title}</h2>
            <p className="text-zinc-500 mb-8 font-medium">{subtitle}</p>
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
