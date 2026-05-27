"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CarFront, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ title: string; desc: string; type: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (title: string, desc: string, type = "default") => {
    setToast({ title, desc, type });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Missing fields", "Please fill in all fields.", "destructive");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      showToast("Welcome back!", "Login successful.", "default");
      const data = await res.json();
      if (data.data?.token) {
        localStorage.setItem("token", data.data.token);
      }
      router.push("/frontend/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password.";
      showToast("Login failed", msg, "destructive");
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

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              />
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
        </div>
      </div>
    </>
  );
}