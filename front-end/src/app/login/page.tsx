"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserService } from "@/service/userService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useSocket } from "@/context/SocketContext";

type FormData = {
  username: string;
  password: string;
};

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<FormData>();

  const userService = new UserService();
  const { initializeSocket } = useSocket();

  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/");
    }
  }, [router]);

  const onSubmit = async (data: FormData) => {
     

    setIsLoading(true);

    try {
      const response = await userService.loginUser(data);

      toast.success("Login successful!");

      reset();
       
      
      // Initialize socket connection after successful login
      const userData = response.data.user;
      if (userData?.user_id || userData?.id) {
        const userId = userData.user_id || userData.id;
         
        initializeSocket(userId.toString());
      }
      
      router.push("/");
    } catch (error: any) {
      console.error("Error during registration:", error);

      if (error.response) {
        const { status, data } = error.response;

        if (status === 409) {
          if (data.message.includes("Email already exists")) {
            setError("username", {
              type: "manual",
              message: "This email is already registered.",
            });

            toast.error("This email is already registered.");
          } else if (data.message.includes("Username already exists")) {
            setError("username", {
              type: "manual",
              message: "This username is already taken.",
            });

            toast.error("This username is already taken.");
          } else {
            toast.error(data.message || "A conflict occurred.");
          }
        } else {
          toast.error(data.message || "An error occurred. Please try again.");
        }
      } else if (error.request) {
        toast.error(
          "Unable to connect to the server. Please check your internet connection."
        );
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-center min-h-[inherit] py-5">
        <Card className="mx-auto max-w-lg w-full">
          <CardHeader>
            <CardTitle className="text-xl">Log in</CardTitle>
            <CardDescription>
              Enter your information to start chatting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username OR email"
                  {...register("username", {
                    required: "Username is required",
                  })}
                />
                {errors.username && (
                  <span className="text-red-500 text-sm">
                    {errors.username.message}
                  </span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                {errors.password && (
                  <span className="text-red-500 text-sm">
                    {errors.password.message}
                  </span>
                )}
              </div>
              <Button type="submit" className="w-full">
                Log in
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
