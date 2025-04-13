"use client";
let counter = 0;

import Link from "next/link";

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
import { useEffect, useState } from "react";

export default function LoginForm() {
  const [count, setCount] = useState("");

  console.log("counting re-renders", (counter += 1));

  return (
    <div className="min-h-screen">
      <div className="flex items-center min-h-[inherit] py-5">
        <Card className="mx-auto max-w-lg w-full">
          <CardHeader>
            <CardTitle className="text-xl">Log in </CardTitle>
            <CardDescription>
              Enter your information to start chatting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="username"
                  autoComplete="off"
                  placeholder="Enter your username OR email "
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  onChange={(e) => setCount(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Create an account
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don't haven an account?{" "}
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
