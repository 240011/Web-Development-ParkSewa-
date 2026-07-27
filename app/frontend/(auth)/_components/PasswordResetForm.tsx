"use client";
import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/actions/auth-actions";
import { Lock } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordForm({
  token,
}: {
  token: string;
}) {
  const [state, formAction] = useActionState(resetPasswordAction, { success: false, message: "" });

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-5 md:p-6 border border-white/20">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Reset password
            </h1>
            <p className="text-gray-600 text-sm max-w-xs">
              Enter your new password below
            </p>
          </div>

          {state.message && !state.success && (
            <div className="fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 bg-red-600 text-white">
              <p className="font-medium text-sm">Reset failed</p>
              <p className="text-xs opacity-90">{state.message}</p>
            </div>
          )}

          <form action={formAction} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">New Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:bg-gradient-to-r hover:from-teal-700 hover:to-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Reset Password
            </button>
          </form>

          <p className="text-center text-gray-500 mt-5 text-sm">
            <Link href="/frontend/login" className="text-teal-600 hover:text-teal-800 font-medium hover:underline transition-colors">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
