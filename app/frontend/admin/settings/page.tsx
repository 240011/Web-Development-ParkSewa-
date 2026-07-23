"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Bell, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, getGetCurrentUserQueryKey } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin-sidebar";
import ChangePasswordForm from "@/components/change-password-form";

type Prefs = {
  emailNewBookings: boolean;
  emailSlotAlerts: boolean;
  emailWeeklyReport: boolean;
};

const defaultPrefs: Prefs = {
  emailNewBookings: true,
  emailSlotAlerts: true,
  emailWeeklyReport: false,
};

const PREFS_STORAGE_KEY = "adminNotificationPrefs";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function AdminSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);

  useEffect(() => {
    if (user) {
      setFullName(user.name ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (stored) {
      try {
        setPrefs({ ...defaultPrefs, ...JSON.parse(stored) });
      } catch {
        // ignore malformed storage
      }
    }
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading settings…</h1>
          <p className="mt-2 text-muted-foreground">Please wait while we verify your access.</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
            <CardDescription>Sign in with an admin account to view settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/frontend/admin/login">
              <Button className="w-full">Go to Admin Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const updatePref = (key: keyof Prefs, value: boolean) => {
    setPrefs((current) => {
      const next = { ...current, [key]: value };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone }),
      });
      const json = (await res.json().catch(() => null)) as { message?: string; data?: Record<string, unknown> } | null;

      if (!res.ok) {
        throw new Error(json?.message ?? "Failed to update profile.");
      }

      if (user) {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), {
          ...user,
          name: json?.data?.fullName ?? fullName,
          email: json?.data?.email ?? email,
          phone: json?.data?.phone ?? phone,
        });
      }

      setMessage("Account details updated successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update profile.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 md:pl-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your admin account and notification preferences.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              Account Details
            </CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <div className={`mb-4 rounded-lg px-3 py-2 text-sm ${messageType === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {message}
              </div>
            )}
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={saving} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={saving} placeholder="Email address" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} disabled={saving} placeholder="Phone number" />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={saving} className="w-full md:w-auto">
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>Change your admin password.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose which email alerts you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">New bookings</p>
                    <p className="text-xs text-muted-foreground">Get emailed when a user books a slot.</p>
                  </div>
                </div>
                <Toggle checked={prefs.emailNewBookings} onChange={(value) => updatePref("emailNewBookings", value)} label="New bookings emails" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Low slot alerts</p>
                    <p className="text-xs text-muted-foreground">Get emailed when a location runs low on slots.</p>
                  </div>
                </div>
                <Toggle checked={prefs.emailSlotAlerts} onChange={(value) => updatePref("emailSlotAlerts", value)} label="Low slot alert emails" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Weekly report</p>
                    <p className="text-xs text-muted-foreground">A summary of bookings and revenue each week.</p>
                  </div>
                </div>
                <Toggle checked={prefs.emailWeeklyReport} onChange={(value) => updatePref("emailWeeklyReport", value)} label="Weekly report emails" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
