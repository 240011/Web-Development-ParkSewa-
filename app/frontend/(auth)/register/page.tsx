"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CarFront, Loader2 } from "lucide-react";

type VehicleType = "Bike" | "Car" | "Truck";

export default function RegisterPage() {
  const router = useRouter();
  const [vehicleType, setVehicleType] = useState<VehicleType>("Bike");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
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
    if (!name || !email || !phone || !password || !vehicleNumber) {
      showToast("Missing fields", "Please fill in all fields.", "destructive");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, email, phone, password, vehicle_number: vehicleNumber, vehicle_type: vehicleType }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      showToast("Account created", "Welcome to ParkSewa.", "default");
      const data = await res.json();
      if (data.data?.token) {
        localStorage.setItem("token", data.data.token);
      }
      router.push("/frontend/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      showToast("Registration failed", msg, "destructive");
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
              Create an account
            </h1>
            <p className="text-gray-600 text-sm max-w-xs">
              Join ParkSewa to book parking spots effortlessly
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <label className="block text-sm font-medium text-gray-800 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="9800000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  placeholder="BA 1 PA 1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Vehicle Type</label>
                <div className="relative">
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                    className="appearance-none w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-9 text-base outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  >
                    <option value="Bike">Bike</option>
                    <option value="Car">Car</option>
                    <option value="Truck">Truck</option>
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:bg-gradient-to-r hover:from-teal-700 hover:to-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing up…
                </span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-5 text-sm">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/frontend/login")}
              className="text-teal-600 hover:text-teal-800 font-medium cursor-pointer hover:underline transition-colors"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </>
  );
}