"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  // Show nothing while checking authentication
  if (!isAuthenticated()) {
    return null;
  }

  return (
    <main>
      <ChatLayout 
        defaultLayout={[320, 480]} 
        navCollapsedSize={8}
      />
    </main>
  );
}
