"use client";

import Link from "next/link";
import { useState } from "react";
import { TSignUpSchema, signUpSchema } from "@/lib/shema";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
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
import { useForm } from "react-hook-form";
import { UserService } from "@/service/userService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const userService = new UserService();
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter(); 

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<TSignUpSchema>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: TSignUpSchema) => {
    setIsLoading(true);

    try {
      const response = await userService.registerUser(data);

      toast.success("Your account has been created successfully.");

      reset();
      console.log("Registration successful:", response);

      router.push("/");
    } catch (error: any) {
      console.error("Error during registration:", error);

      if (error.response) {
        const { status, data } = error.response;

        if (status === 409) {
          if (data.message.includes("Email already exists")) {
            setError("email", {
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
      <ToastContainer />
      <div className="flex items-center min-h-[inherit] py-5">
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle className="text-xl">Sign Up</CardTitle>
            <CardDescription>
              Enter your information to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-2 gap-x-4 gap-y-2"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div>
                <Label htmlFor="first-name">First name</Label>
                <Input
                  {...register("firstName")}
                  id="first-name"
                  placeholder="Max"
                  className="mt-1"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 font-medium mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  {...register("lastName")}
                  id="last-name"
                  placeholder="Robinson"
                  className="mt-1"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 font-medium mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  {...register("email")}
                  id="email"
                  type="text"
                  autoComplete="off"
                  placeholder="m@example.com"
                  className="mt-1"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 font-medium mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  {...register("username")}
                  id="username"
                  type="text"
                  autoComplete="off"
                  placeholder="Enter your username"
                  className="mt-1"
                />
                {errors.username && (
                  <p className="text-sm text-red-600 font-medium mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  {...register("password")}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  className="mt-1"
                />
                {errors.password && (
                  <p className="text-sm text-red-600 font-medium mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  {...register("confirmPassword")}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  className="mt-1"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 font-medium mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="picture">Upload Image</Label>
                <Input
                  {...register("image")}
                  className="mt-1"
                  id="picture"
                  type="file"
                />
              </div>

              <Button
                type="submit"
                className="w-full col-span-2"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create an account"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
