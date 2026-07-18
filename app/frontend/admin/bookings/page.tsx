"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/format";
import { Calendar, Car, Clock, CreditCard, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import AdminSidebar from "@/components/admin-sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type BookingStatus = "active" | "pending" | "completed" | "cancelled";

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

const statusClasses: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

function useAdminBookings() {
  return useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async (): Promise<Booking[]> => {
      const res = await fetch("/api/v1/admin/bookings", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const json = (await res.json()) as { data?: Booking[] };
      return Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export default function AdminBookingsPage() {
  const { data: bookings, isLoading } = useAdminBookings();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");

  const statusFilters: (BookingStatus | "all")[] = ["all", "active", "pending", "completed", "cancelled"];

  const filteredBookings = (bookings ?? []).filter((booking) => {
    const matchesQuery = [
      booking.user?.name,
      booking.spot?.name,
      booking.vehicleNumber,
      booking.startTime,
      booking.endTime,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
            <CardDescription>Sign in with an admin account to view all bookings.</CardDescription>
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

  const totalRevenue = bookings?.reduce((sum, b) => sum + b.totalAmount, 0) ?? 0;
  const activeCount = bookings?.filter((b) => b.status === "active").length ?? 0;
  const completedCount = bookings?.filter((b) => b.status === "completed").length ?? 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
        <div className="flex items-center gap-4">
          <Link href="/frontend/admin/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 -ml-4">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Bookings</h1>
            <p className="text-muted-foreground">View and manage all user bookings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">All bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Management</CardTitle>
            <CardDescription>View all user bookings with details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, spot, vehicle..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "all")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                {statusFilters.map((status) => (
                  <option key={status} value={status}>
                    {status === "all" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Car className="h-10 w-10 mb-3 opacity-60" />
                <p className="font-medium">No bookings found</p>
                <p className="text-sm">Try changing your search or filter.</p>
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
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{booking.user?.name || "—"}</td>
                        <td className="p-3">{booking.spot?.name || "—"}</td>
                        <td className="p-3">{booking.vehicleNumber}</td>
                        <td className="p-3">{formatDate(booking.startTime)}</td>
                        <td className="p-3">{booking.endTime ? formatDate(booking.endTime) : "—"}</td>
                        <td className="p-3 text-right">{formatCurrency(booking.totalAmount)}</td>
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