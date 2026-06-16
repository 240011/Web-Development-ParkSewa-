"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
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
  description: string;
  discountType: "percentage" | "fixed";
  value: number;
  expiryDate: string;
  isActive: boolean;
};

type Booking = {
  id: number;
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
  totalSlots: 10,
  pricePerHour: 50,
  vehicleTypes: ["car"],
  status: "active",
  images: [],
};

const initialSpots: ParkingSpot[] = [
  {
    id: "spot-1",
    name: "Downtown Parking",
    address: "Durbar Marg, Kathmandu",
    location: "Kathmandu",
    totalSlots: 120,
    availableSlots: 28,
    pricePerHour: 80,
    vehicleTypes: ["bike", "car", "truck"],
    status: "active",
    images: [],
  },
  {
    id: "spot-2",
    name: "Mall Parking",
    address: "Putalisadak, Kathmandu",
    location: "Kathmandu",
    totalSlots: 200,
    availableSlots: 44,
    pricePerHour: 60,
    vehicleTypes: ["bike", "car"],
    status: "active",
    images: [],
  },
  {
    id: "spot-3",
    name: "Airport Parking",
    address: "Tribhuvan Airport Road",
    location: "Kathmandu",
    totalSlots: 150,
    availableSlots: 96,
    pricePerHour: 100,
    vehicleTypes: ["car", "truck"],
    status: "inactive",
    images: [],
  },
];

const promos: Promo[] = [
  {
    id: "promo-1",
    code: "PARK20",
    description: "20% off on weekday bookings",
    discountType: "percentage",
    value: 20,
    expiryDate: "2026-07-30",
    isActive: true,
  },
  {
    id: "promo-2",
    code: "WEEKEND50",
    description: "Rs 50 off weekend parking",
    discountType: "fixed",
    value: 50,
    expiryDate: "2026-06-30",
    isActive: true,
  },
  {
    id: "promo-3",
    code: "FIRSTPARK",
    description: "First parking discount",
    discountType: "percentage",
    value: 15,
    expiryDate: "2026-06-20",
    isActive: false,
  },
];

const statusClasses: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  inactive: "bg-slate-100 text-slate-700",
};

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const [spots, setSpots] = useState<ParkingSpot[]>(initialSpots);
  const [editingSpot, setEditingSpot] = useState<ParkingSpot | null>(null);
  const [formData, setFormData] = useState<SpotFormData>(defaultSpotForm);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const { data: apiBookings, isLoading: loadingBookings } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async (): Promise<Booking[]> => {
      const res = await fetch("/api/v1/bookings", { credentials: "include" });
      if (!res.ok) return [];
      const json = await res.json() as { data?: Booking[] };
      return Array.isArray(json.data) ? json.data : [];
    },
  });

  const fallbackBookings = useMemo<Booking[]>(
    () => [
      {
        id: 1048,
        user: { name: "Aarav Sharma" },
        spot: { name: "Downtown Parking" },
        vehicleNumber: "BA 1 PA 1234",
        startTime: "2026-06-15T09:30:00",
        endTime: "2026-06-15T11:30:00",
        totalAmount: 160,
        status: "active",
      },
      {
        id: 1047,
        user: { name: "Nisha Adhikari" },
        spot: { name: "Mall Parking" },
        vehicleNumber: "BA 2 CH 5678",
        startTime: "2026-06-15T09:00:00",
        totalAmount: 120,
        status: "pending",
      },
    ],
    []
  );

  const bookings = useMemo(
    () => (apiBookings?.length ? apiBookings : fallbackBookings),
    [apiBookings, fallbackBookings]
  );

  const totalSlots = useMemo(() => spots.reduce((sum, spot) => sum + spot.totalSlots, 0), [spots]);
  const occupiedSlots = useMemo(
    () => spots.reduce((sum, spot) => sum + (spot.totalSlots - spot.availableSlots), 0),
    [spots]
  );
  const freeSlots = totalSlots - occupiedSlots;
  const totalRevenue = useMemo(
    () => bookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
    [bookings]
  );

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
  }

  function openEditDialog(spot: ParkingSpot) {
    setEditingSpot(spot);
    setFormData({
      name: spot.name,
      address: spot.address,
      location: spot.location,
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

  function handleSubmit() {
    if (editingSpot) {
      setSpots((current) => current.map((spot) => (
        spot.id === editingSpot.id
          ? {
              ...spot,
              ...formData,
              availableSlots: Math.min(formData.totalSlots, formData.totalSlots),
            }
          : spot
      )));
    } else {
      const spot: ParkingSpot = {
        id: `spot-${Date.now()}`,
        ...formData,
        availableSlots: formData.totalSlots,
      };
      setSpots((current) => [spot, ...current]);
    }

    resetForm();
  }

  function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this parking spot?")) return;

    setSpots((current) => current.filter((spot) => spot.id !== id));
    if (editingSpot?.id === id) {
      resetForm();
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
                    <p className="mt-1 text-sm text-muted-foreground">{promo.description}</p>
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
                  <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="button" className="flex-1" onClick={handleSubmit}>
                    {editingSpot ? "Update" : "Create"}
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Location</th>
                    <th className="p-3 text-left">Address</th>
                    <th className="p-3 text-center">Slots</th>
                    <th className="p-3 text-center">Price/hr</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {spots.map((spot) => (
                    <tr key={spot.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{spot.name}</td>
                      <td className="p-3">{spot.location}</td>
                      <td className="p-3">{spot.address}</td>
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
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(spot.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            {loadingBookings ? (
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
                    {bookings.slice(0, 10).map((booking) => (
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
