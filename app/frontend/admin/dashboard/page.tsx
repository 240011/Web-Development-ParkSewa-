"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  Car,
  CarFront,
  CheckCircle,
  Edit,
  FileDown,
  Loader2,
  MapPin,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { ENDPOINTS } from "@/lib/endpoints";
import AdminSidebar from "@/components/admin-sidebar";
import { cn } from "@/lib/utils";

type BookingStatus = "active" | "pending" | "completed" | "cancelled";
type SpotStatus = "active" | "inactive";
type VehicleType = "bike" | "car" | "truck";

type ParkingSpot = {
  id: string;
  name: string;
  address: string;
  location: string;
  latitude?: number;
  longitude?: number;
  totalSlots: number;
  availableSlots: number;
  pricePerHour: number;
  vehicleTypes: VehicleType[];
  status: SpotStatus;
  images: string[];
};

type Promo = {
  id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  value: number;
  expiryDate: string;
  isActive: boolean;
};

type Booking = {
  id: string;
  user?: { name: string };
  spot?: { name: string };
  vehicleNumber: string;
  startTime: string;
  endTime?: string;
  totalAmount: number;
  status: BookingStatus;
};

type SpotFormData = {
  name: string;
  address: string;
  location: string;
  latitude?: number;
  longitude?: number;
  totalSlots: number;
  pricePerHour: number;
  vehicleTypes: VehicleType[];
  status: SpotStatus;
  images: string[];
};

const defaultSpotForm: SpotFormData = {
  name: "",
  address: "",
  location: "",
  latitude: undefined,
  longitude: undefined,
  totalSlots: 10,
  pricePerHour: 50,
  vehicleTypes: ["car"],
  status: "active",
  images: [],
};

const statusClasses: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  inactive: "bg-slate-100 text-slate-700",
};

function Pagination({ page, totalPages, totalItems, onPageChange, pageSize }: { page: number; totalPages: number; totalItems: number; onPageChange: (p: number) => void; pageSize: number }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm">
        Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalItems)} of {totalItems}
      </div>
      <div className="flex items-center gap-1">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 rounded text-sm ${p === page ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"}`}
          >
            {p}
          </button>
        ))}
        {page > 1 && (
          <button onClick={() => onPageChange(page - 1)} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
            Prev
          </button>
        )}
        {page < totalPages && (
          <button onClick={() => onPageChange(page + 1)} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [editingSpot, setEditingSpot] = useState<ParkingSpot | null>(null);
  const [formData, setFormData] = useState<SpotFormData>(defaultSpotForm);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: spots = [], isLoading: spotsLoading, refetch: refetchSpots } = useQuery<ParkingSpot[]>({
    queryKey: ["admin-parking-spots"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/parking-spots", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load parking spots");
      const json = await res.json() as { data?: ParkingSpot[] };
      return json.data ?? [];
    },
  });

const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/bookings", { credentials: "include" });
      if (!res.ok) return [] as Booking[];
      const json = await res.json() as { data?: Booking[] };
      return json.data ?? [];
    },
  });

  const { data: promos = [], isLoading: promosLoading } = useQuery<Promo[]>({
    queryKey: ["admin-promos"],
    queryFn: async () => {
      const res = await fetch(ENDPOINTS.promos.adminList, { credentials: "include" });
      if (!res.ok) return [] as Promo[];
      const json = await res.json() as { data?: Promo[] };
      return json.data ?? [];
    },
  });

  const isLoading = authLoading || spotsLoading || bookingsLoading || promosLoading;

  const [spotsPage, setSpotsPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const LIMIT = 10;

  const spotsTotalPages = Math.ceil(spots.length / LIMIT) || 1;
  const paginatedSpots = spots.slice((spotsPage - 1) * LIMIT, spotsPage * LIMIT);

  const bookingsTotalPages = Math.ceil(bookings.length / LIMIT) || 1;
  const paginatedBookings = bookings.slice((bookingsPage - 1) * LIMIT, bookingsPage * LIMIT);

  const totalSlots = spots.reduce((sum, spot) => sum + spot.totalSlots, 0);
  const occupiedSlots = spots.reduce((sum, spot) => sum + (spot.totalSlots - spot.availableSlots), 0);
  const freeSlots = totalSlots - occupiedSlots;
  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading admin dashboard…</h1>
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
            <CardDescription>Sign in with an admin account to view this dashboard.</CardDescription>
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

  function resetForm() {
    setFormData(defaultSpotForm);
    setEditingSpot(null);
    setNewImageUrl("");
    setUploadMessage("");
    setFormMessage("");
    setSubmitting(false);
  }

  function openEditDialog(spot: ParkingSpot) {
    setEditingSpot(spot);
    setFormData({
      name: spot.name,
      address: spot.address,
      location: spot.location,
      latitude: spot.latitude,
      longitude: spot.longitude,
      totalSlots: spot.totalSlots,
      pricePerHour: spot.pricePerHour,
      vehicleTypes: spot.vehicleTypes,
      status: spot.status,
      images: spot.images,
    });
    setNewImageUrl("");
    setUploadMessage("");
  }

  function toggleVehicleType(type: VehicleType) {
    setFormData((current) => ({
      ...current,
      vehicleTypes: current.vehicleTypes.includes(type)
        ? current.vehicleTypes.filter((item) => item !== type)
        : [...current.vehicleTypes, type],
    }));
  }

  function addImage() {
    const url = newImageUrl.trim();
    if (!url) return;

    setFormData((current) => ({
      ...current,
      images: [...current.images, url],
    }));
    setNewImageUrl("");
  }

  function removeImage(index: number) {
    setFormData((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const res = await fetch("/api/v1/uploads", {
        method: "POST",
        body: uploadForm,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json() as { data?: { url?: string } };
      const uploadedUrl = data.data?.url;
      if (uploadedUrl) {
        setFormData((current) => ({
          ...current,
          images: [...current.images, uploadedUrl],
        }));
      }
    } catch {
      setUploadMessage("Could not upload image");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!formData.name.trim() || !formData.address.trim() || !formData.location.trim()) {
      setFormMessage("Name, address and location are required");
      return;
    }

    setSubmitting(true);
    setFormMessage("");

    try {
      const url = editingSpot ? `/api/v1/admin/parking-spots/${editingSpot.id}` : "/api/v1/admin/parking-spots";
      const res = await fetch(url, {
        method: editingSpot ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          images: formData.images,
        }),
      });

      const json = await res.json() as { message?: string; data?: ParkingSpot };
      if (!res.ok) {
        throw new Error(json.message ?? "Failed to save parking spot");
      }

      const successMessage = editingSpot ? "Parking location updated" : "Parking location created";
await queryClient.invalidateQueries({ queryKey: ["admin-parking-spots"] });
       resetForm();
       setFormMessage(successMessage);
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Failed to save parking spot");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this parking location?")) return;

    setDeletingId(id);
    setFormMessage("");

    try {
      const res = await fetch(`/api/v1/admin/parking-spots/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json() as { message?: string };
      if (!res.ok) {
        throw new Error(json.message ?? "Failed to delete parking spot");
      }

await queryClient.invalidateQueries({ queryKey: ["admin-parking-spots"] });
       if (editingSpot?.id === id) {
        resetForm();
      }
      setFormMessage("Parking location deleted");
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Failed to delete parking spot");
    } finally {
      setDeletingId(null);
    }
  }

  function handleExportBookings() {
    if (!bookings.length) return;

    const csv = [
      ["ID", "User", "Spot", "Vehicle", "Status", "Start Time", "End Time", "Amount"].join(","),
      ...bookings.map((booking) => [
        booking.id,
        booking.user?.name || "",
        booking.spot?.name || "",
        booking.vehicleNumber,
        booking.status,
        booking.startTime,
        booking.endTime || "",
        booking.totalAmount,
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bookings_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage parking locations, bookings, promos, and revenue.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/frontend/admin/bookings">
              <Button variant="outline" className="gap-2">
                <CalendarCheck className="h-4 w-4" />
                Bookings
              </Button>
            </Link>
            <Link href="/frontend/admin/reports">
              <Button className="gap-2">
                <FileDown className="h-4 w-4" />
                Reports
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Spots</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spots.length}</div>
              <p className="text-xs text-muted-foreground">{totalSlots} total slots</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Occupied</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{occupiedSlots}</div>
              <p className="text-xs text-muted-foreground">Currently in use</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Free Slots</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{freeSlots}</div>
              <p className="text-xs text-muted-foreground">Available for booking</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <CarFront className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Total earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Promo Codes</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promos.filter((promo) => promo.isActive).length}</div>
              <p className="text-xs text-muted-foreground">Active codes</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Promo Codes</CardTitle>
            <CardDescription>Active promotional discount codes</CardDescription>
          </CardHeader>
          <CardContent>
            {promos.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {promos.map((promo) => (
                  <div key={promo.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg font-bold">{promo.code}</span>
                      <Badge variant={promo.isActive ? "default" : "secondary"}>
                        {promo.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{promo.description ?? ""}</p>
                    <div className="mt-2 text-sm">
                      {promo.discountType === "percentage" ? `${promo.value}% off` : `रू ${promo.value} off`}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Expires: {new Date(promo.expiryDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">No promo codes found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingSpot ? "Edit Parking Location" : "Add Parking Location"}</CardTitle>
            <CardDescription>Manage all parking spots from the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            {formMessage && (
              <p className={`mb-4 text-sm ${formMessage.toLowerCase().includes("failed") || formMessage.toLowerCase().includes("required") ? "text-destructive" : "text-green-600"}`}>
                {formMessage}
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-2 lg:col-span-2">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      placeholder="Location name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City/Location</label>
                    <Input
                      value={formData.location}
                      onChange={(event) => setFormData({ ...formData, location: event.target.value })}
                      placeholder="City name"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input
                      value={formData.address}
                      onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                      placeholder="Full address"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Latitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.latitude ?? ""}
                      onChange={(event) => setFormData({ ...formData, latitude: event.target.value ? Number(event.target.value) : undefined })}
                      placeholder="e.g., 27.7172"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Longitude</label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.longitude ?? ""}
                      onChange={(event) => setFormData({ ...formData, longitude: event.target.value ? Number(event.target.value) : undefined })}
                      placeholder="e.g., 85.3240"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Slots</label>
                    <Input
                      type="number"
                      value={formData.totalSlots}
                      onChange={(event) => setFormData({ ...formData, totalSlots: Number(event.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price per Hour</label>
                    <Input
                      type="number"
                      value={formData.pricePerHour}
                      onChange={(event) => setFormData({ ...formData, pricePerHour: Number(event.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={formData.status === "active" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({ ...formData, status: "active" })}
                      >
                        Active
                      </Button>
                      <Button
                        type="button"
                        variant={formData.status === "inactive" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({ ...formData, status: "inactive" })}
                      >
                        Inactive
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vehicle Types</label>
                    <div className="flex flex-wrap gap-2">
                      {(["bike", "car", "truck"] as VehicleType[]).map((type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={formData.vehicleTypes.includes(type) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleVehicleType(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Images</label>
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(event) => setNewImageUrl(event.target.value)}
                    placeholder="Enter image URL"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addImage();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addImage}>Add</Button>
                </div>
                <Input type="file" accept="image/*" onChange={handleFileUpload} className="cursor-pointer" />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploadMessage && <p className="text-sm text-destructive">{uploadMessage}</p>}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.images.map((url, index) => (
                      <div key={url} className="group relative">
                        <Image src={url} alt="" className="h-16 w-full rounded border object-cover" width={96} height={64} />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => removeImage(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={resetForm} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="button" className="flex-1" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : editingSpot ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parking Locations</CardTitle>
            <CardDescription>Manage all parking spots</CardDescription>
          </CardHeader>
          <CardContent>
            {false ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : spots.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No parking locations found. Add your first location above.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
<thead>
                     <tr className="border-b">
                       <th className="p-3 text-left">Name</th>
                       <th className="p-3 text-left">Location</th>
                       <th className="p-3 text-left">Address</th>
                       <th className="p-3 text-center">Coords</th>
                       <th className="p-3 text-center">Slots</th>
                       <th className="p-3 text-center">Price/hr</th>
                       <th className="p-3 text-center">Status</th>
                       <th className="p-3 text-center">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {paginatedSpots.map((spot) => (
                       <tr key={spot.id} className="border-b hover:bg-muted/50">
                         <td className="p-3 font-medium">{spot.name}</td>
                         <td className="p-3">{spot.location}</td>
                         <td className="p-3">{spot.address}</td>
                         <td className="p-3 text-center text-xs text-muted-foreground">
                           {spot.latitude && spot.longitude ? `${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}` : "—"}
                         </td>
                         <td className="p-3 text-center">
                           <span className="font-medium text-green-600">{spot.availableSlots}</span>
                           <span className="text-muted-foreground">/{spot.totalSlots}</span>
                         </td>
                         <td className="p-3 text-center">{formatCurrency(spot.pricePerHour)}</td>
                         <td className="p-3 text-center">
                           <Badge variant={spot.status === "active" ? "default" : "secondary"}>
                             {spot.status}
                           </Badge>
                         </td>
                         <td className="p-3 text-center">
                           <div className="flex justify-center gap-2">
                             <Button variant="ghost" size="icon" onClick={() => openEditDialog(spot)}>
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(spot.id)} disabled={deletingId === spot.id}>
                               {deletingId === spot.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                             </Button>
                           </div>
                         </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
                <div className="mt-4">
                  <Pagination page={spotsPage} totalPages={spotsTotalPages} totalItems={spots.length} onPageChange={setSpotsPage} pageSize={LIMIT} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>View all user bookings</CardDescription>
            </div>
            <Button variant="outline" className="gap-2" onClick={handleExportBookings}>
              <FileDown className="h-4 w-4" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
{bookingsLoading ? (
               <div className="flex justify-center p-8">
                 <Loader2 className="h-8 w-8 animate-spin" />
               </div>
             ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-left">Spot</th>
                      <th className="p-3 text-left">Vehicle</th>
                      <th className="p-3 text-left">Start Time</th>
                      <th className="p-3 text-left">End Time</th>
                      <th className="p-3 text-center">Amount</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">{booking.user?.name || "-"}</td>
                        <td className="p-3">{booking.spot?.name || "-"}</td>
                        <td className="p-3">{booking.vehicleNumber}</td>
                        <td className="p-3">{formatDate(booking.startTime)}</td>
                        <td className="p-3">{booking.endTime ? formatDate(booking.endTime) : "-"}</td>
                        <td className="p-3 text-center">{formatCurrency(booking.totalAmount)}</td>
                        <td className="p-3 text-center">
                          <Badge className={cn("capitalize", statusClasses[booking.status])}>
                            {booking.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4">
                  <Pagination page={bookingsPage} totalPages={bookingsTotalPages} totalItems={bookings.length} onPageChange={setBookingsPage} pageSize={LIMIT} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
