"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const RouteProtection = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    const authRoutes = ["/login", "/signup"];

    // If user is logged in and tries to access login/signup → redirect
    if (token && authRoutes.includes(pathname)) {
      router.replace("/"); // or dashboard
    }

    // If user is NOT logged in → allow only auth routes
    if (!token && !authRoutes.includes(pathname)) {
      router.replace("/login");
    }

    setChecking(false);
  }, [pathname, router]);

  if (checking) return null;

  return <>{children}</>;
};

export default RouteProtection;
