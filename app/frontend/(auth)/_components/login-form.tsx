"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "./schema";
import { loginAction } from "@/lib/actions/auth-actions";
import { CarFront, Loader2 } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ title: string; desc: string; type: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const showToast = (title: string, desc: string, type = "default") => {
    setToast({ title, desc, type });
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const result = await loginAction(data);
      if (result.success) {
        showToast("Welcome back!", "Login successful.", "default");
        await queryClient.invalidateQueries();
        router.push(result.user?.role === "admin" ? "/frontend/admin/dashboard" : "/frontend/dashboard");
      } else {
        showToast("Login failed", result.message || "Invalid email or password.", "destructive");
      }
    } catch {
      showToast("Login failed", "Something went wrong.", "destructive");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "destructive" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
          <p className="font-medium text-sm">{toast.title}</p>
          <p className="text-xs opacity-90">{toast.desc}</p>
        </div>
      )}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-5 md:p-6 border border-white/20">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center mb-3">
              <CarFront className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Welcome back
            </h1>
            <p className="text-gray-600 text-sm max-w-xs">
              Login to ParkSewa to access your parking bookings
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                {...register("email")}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:bg-gradient-to-r hover:from-teal-700 hover:to-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-5 text-sm">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/frontend/register")}
              className="text-teal-600 hover:text-teal-800 font-medium cursor-pointer hover:underline"
            >
              Sign Up
            </button>
          </p>

          <p className="text-center mt-4">
            <button
              type="button"
              onClick={() => router.push("/frontend/forget_password")}
              className="text-gray-400 hover:text-teal-600 text-xs font-medium cursor-pointer hover:underline"
            >
              Forgot Password?
            </button>
          </p>
        </div>
      </div>
    </>
  );
}