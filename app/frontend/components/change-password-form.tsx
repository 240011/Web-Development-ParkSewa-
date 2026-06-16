"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordAction } from "@/lib/actions/auth-actions";
import { changePasswordSchema, ChangePasswordFormData } from "@/(auth)/_components/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck } from "lucide-react";

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setLoading(true);
    setMessage("");

    try {
      const result = await changePasswordAction(data);

      if (result.success) {
        setMessage("Password updated successfully.");
        setMessageType("success");
        reset();
      } else {
        setMessage(result.message || "Failed to update password.");
        setMessageType("error");
      }
    } catch {
      setMessage("Something went wrong while updating your password.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Change Password</h3>
          <p className="text-sm text-muted-foreground">Keep your account secure with a strong password.</p>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg px-3 py-2 text-sm ${messageType === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Password</label>
          <Input type="password" placeholder="Enter current password" disabled={loading} {...register("currentPassword")} />
          {errors.currentPassword && (
            <p className="text-red-500 text-xs">{errors.currentPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">New Password</label>
          <Input type="password" placeholder="Enter new password" disabled={loading} {...register("newPassword")} />
          {errors.newPassword && (
            <p className="text-red-500 text-xs">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Confirm New Password</label>
          <Input type="password" placeholder="Confirm new password" disabled={loading} {...register("confirmPassword")} />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating...
          </span>
        ) : (
          "Update Password"
        )}
      </Button>
    </form>
  );
}
