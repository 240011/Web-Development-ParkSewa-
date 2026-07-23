"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGetCurrentUserQueryKey, useAuth } from "@/hooks/use-auth";
import { Calendar, MapPin, Star, Trophy, User } from "lucide-react";
import Sidebar from "../components/app-sidebar";
import ChangePasswordForm from "../components/change-password-form";

type VehicleType = "Bike" | "Car" | "Truck";

type ProfileForm = {
  fullName: string;
  email: string;
  phone: string;
  licensePlate: string;
  vehicleType: VehicleType;
};

function formatMemberSince(createdAt?: string): string {
  if (!createdAt) return "—";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveToastTimerRef = useRef<number | null>(null);
  const uploadToastTimerRef = useRef<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadToastType, setUploadToastType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveToastType, setSaveToastType] = useState<"success" | "error">("success");
  const [isEditing, setIsEditing] = useState(false);
  const [draftProfile, setDraftProfile] = useState<Partial<ProfileForm>>({});

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await fetch("/api/v1/bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load bookings");
      const json = (await res.json()) as { data?: unknown[] };
      return json.data ?? [];
    },
  });

  const totalBookings = Array.isArray(bookings) ? bookings.length : 0;
  const memberSince = formatMemberSince(user?.createdAt);

  const stats = [
    { label: "Member Since", value: memberSince, icon: Calendar, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Total Bookings", value: totalBookings, icon: MapPin, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { label: "Reward Points", value: "1,250", icon: Star, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    { label: "Membership Tier", value: "Premium Member", icon: Trophy, className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  ];

  const profileForm: ProfileForm = {
    fullName: draftProfile.fullName ?? user?.name ?? "",
    email: draftProfile.email ?? user?.email ?? "",
    phone: draftProfile.phone ?? user?.phone ?? "",
    licensePlate: draftProfile.licensePlate ?? user?.vehicleNumber ?? "",
    vehicleType: draftProfile.vehicleType ?? (user?.vehicleType as VehicleType) ?? "Bike",
  };

  const profileImageUrl =
    user?.profileImageUrl ??
    (typeof window !== "undefined" && user
      ? window.localStorage.getItem(`profileImageUrl:${user.id}`)
      : null);

  const profile = {
    fullName: user?.name ?? "Guest User",
    email: user?.email ?? "Not provided",
    phone: user?.phone ?? "Not provided",
    profileImageUrl,
    licensePlate: user?.vehicleNumber ?? "Not provided",
    vehicleType: user?.vehicleType ?? "Not provided",
    memberSince,
    bookings: totalBookings,
    rewardPoints: 1250,
    membershipTier: "Premium Member",
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setDraftProfile((current) => ({ ...current, [name]: value } as Partial<ProfileForm>));
  };

  const handleEnableEdit = () => {
    setSaveMessage("");
    setIsEditing(true);
  };

  const showProfileToast = (message: string, type: "success" | "error") => {
    if (saveToastTimerRef.current) {
      window.clearTimeout(saveToastTimerRef.current);
    }

    setSaveToastType(type);
    setSaveMessage(message);
    saveToastTimerRef.current = window.setTimeout(() => {
      setSaveMessage("");
    }, 3000);
  };

  const showUploadToast = (message: string, type: "success" | "error") => {
    if (uploadToastTimerRef.current) {
      window.clearTimeout(uploadToastTimerRef.current);
    }

    setUploadToastType(type);
    setUploadMessage(message);
    uploadToastTimerRef.current = window.setTimeout(() => {
      setUploadMessage("");
    }, 3000);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadMessage("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage("File size must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/v1/uploads", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const uploadJson = (await uploadResponse.json().catch(() => null)) as { data?: { url?: string }; message?: string } | null;

      if (!uploadResponse.ok) {
        throw new Error(uploadJson?.message ?? "Failed to upload photo.");
      }

      const imageUrl = uploadJson?.data?.url;
      if (!imageUrl) {
        throw new Error("Upload did not return an image URL.");
      }

      const updateResponse = await fetch("/api/v1/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImageUrl: imageUrl }),
      });
      const updateJson = (await updateResponse.json().catch(() => null)) as { message?: string } | null;

      if (!updateResponse.ok) {
        throw new Error(updateJson?.message ?? "Failed to update profile photo.");
      }

      if (user) {
        window.localStorage.setItem(`profileImageUrl:${user.id}`, imageUrl);
        queryClient.setQueryData(getGetCurrentUserQueryKey(), { ...user, profileImageUrl: imageUrl });
      }

      setUploadMessage("Profile photo uploaded successfully.");
      showUploadToast("Profile photo uploaded successfully", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload photo.";
      setUploadMessage(message);
      showUploadToast(message, "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveMessage("");

    try {
      const profilePayload = {
        ...profileForm,
        ...(profileImageUrl ? { profileImageUrl } : { profileImageUrl: null }),
      };

      const response = await fetch("/api/v1/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });
      const json = (await response.json().catch(() => null)) as {
        data?: {
          fullName?: string;
          email?: string;
          phone?: string;
          licensePlate?: string;
          vehicleType?: VehicleType;
          profileImageUrl?: string | null;
        };
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(json?.message ?? "Failed to update profile.");
      }

      if (user) {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), {
          ...user,
          name: json?.data?.fullName ?? profileForm.fullName,
          email: json?.data?.email ?? profileForm.email,
          phone: json?.data?.phone ?? profileForm.phone,
          vehicleNumber: json?.data?.licensePlate ?? profileForm.licensePlate,
          vehicleType: json?.data?.vehicleType ?? profileForm.vehicleType,
          profileImageUrl: json?.data?.profileImageUrl ?? profileImageUrl,
        });
      }

      showProfileToast("Profile updated successfully", "success");
      setIsEditing(false);
      setDraftProfile({});
    } catch (error) {
      showProfileToast(error instanceof Error ? error.message : "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {saveMessage && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg ${saveToastType === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          <p className="font-medium text-sm">{saveToastType === "success" ? "Profile updated" : "Update failed"}</p>
          <p className="text-xs opacity-90">{saveMessage}</p>
        </div>
      )}
      {uploadMessage && (
        <div className={`fixed top-20 right-4 z-50 rounded-lg px-4 py-3 shadow-lg ${uploadToastType === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          <p className="font-medium text-sm">{uploadToastType === "success" ? "Photo uploaded" : "Upload failed"}</p>
          <p className="text-xs opacity-90">{uploadMessage}</p>
        </div>
      )}
      <Sidebar />
      <div className="flex-1 md:pl-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">Manage your account details and membership information.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || saving}
                  className="relative h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold overflow-hidden bg-cover bg-center disabled:cursor-not-allowed disabled:opacity-70"
                  style={profile.profileImageUrl ? { backgroundImage: `url(${profile.profileImageUrl})` } : undefined}
                  aria-label="Upload profile photo"
                >
                  {!profile.profileImageUrl && <User className="h-10 w-10" />}
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center text-xs font-medium">
                      Uploading...
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div>
                  <CardTitle>{profileForm.fullName || profile.fullName}</CardTitle>
                  <CardDescription>{profile.membershipTier}</CardDescription>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge>{profile.membershipTier}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input name="fullName" value={profileForm.fullName} onChange={handleInputChange} disabled={!isEditing || isLoading || saving} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input name="email" type="email" value={profileForm.email} onChange={handleInputChange} disabled={!isEditing || isLoading || saving} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input name="phone" value={profileForm.phone} onChange={handleInputChange} disabled={!isEditing || isLoading || saving} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">License Plate</label>
                  <Input name="licensePlate" value={profileForm.licensePlate} onChange={handleInputChange} disabled={!isEditing || isLoading || saving} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={profileForm.vehicleType}
                    onChange={handleInputChange}
                    disabled={!isEditing || isLoading || saving}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Bike">Bike</option>
                    <option value="Car">Car</option>
                    <option value="Truck">Truck</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex flex-col sm:flex-row justify-end items-center gap-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isEditing || isLoading || saving}
                      onClick={handleEnableEdit}
                    >
                      Update
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isEditing || isLoading || saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Membership Summary</CardTitle>
              <CardDescription>Your ParkSewa account overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${stat.className}`}>
                        <stat.icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="font-semibold">{stat.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
