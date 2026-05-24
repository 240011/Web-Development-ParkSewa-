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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      showToast("Welcome back!", "Login successful.", "default");
      router.push("/register");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password.";
      showToast("Login failed", msg, "destructive");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 relative">
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "destructive" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
          <p className="font-medium text-sm">{toast.title}</p>
          <p className="text-xs opacity-90">{toast.desc}</p>
        </div>
      )}
       <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-6 md:p-8">
         <div className="flex flex-col items-center text-center">
           <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
             <CarFront className="w-8 h-8 text-teal-600" />
           </div>
           <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
           <p className="text-gray-500 mt-2 text-base">Sign in to your ParkSewa account</p>
         </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-base font-medium text-gray-800 mb-1">Email</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:ring-3 focus:ring-teal-100 focus:border-teal-500 transition"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-gray-800 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:ring-3 focus:ring-teal-100 focus:border-teal-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white text-base font-semibold py-3 rounded-xl transition shadow-md"
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

        <p className="text-center text-gray-500 mt-8 text-lg">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="text-teal-600 font-medium cursor-pointer hover:underline"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
