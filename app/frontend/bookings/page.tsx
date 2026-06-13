"use client";

import { useMemo, useState } from "react";
import { useListBookings, Booking } from "@/hooks/use-bookings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Calendar,
  Car,
  Clock,
  CreditCard,
  MapPin,
  Search,
  TrendingUp,
} from "lucide-react";
import Sidebar from "../components/app-sidebar";

type BookingStatus = Booking["status"];
type BookingStatusFilter = "all" | BookingStatus;

type BookingEntity = {
  title: string;
  location: string;
  date: string;
  time: string;
  amount: string;
  status: BookingStatus;
};

const statusFilters: BookingStatusFilter[] = [
  "all",
  "active",
  "pending",
  "completed",
  "cancelled",
];

function getBookingTime(startTime: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startTime));
}

function getStatusVariant(status: BookingStatus) {
  switch (status) {
    case "active":
      return "default";
    case "completed":
      return "secondary";
    case "pending":
      return "outline";
    case "cancelled":
      return "destructive";
  }
}

export default function BookingsPage() {
  const { data: bookings, isLoading } = useListBookings();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>("all");

  const entities = useMemo<BookingEntity[]>(() => {
    return (bookings ?? []).map((booking) => ({
      title: `Parking Session #${booking.id}`,
      location: booking.spot?.name ?? "Unknown parking spot",
      date: formatDate(booking.startTime).split(",")[0],
      time: getBookingTime(booking.startTime),
      amount: formatCurrency(booking.totalAmount),
      status: booking.status,
    }));
  }, [bookings]);

  const filteredBookings = entities.filter((booking) => {
    const matchesQuery = [booking.title, booking.location, booking.date, booking.time]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const totalSpent = bookings?.reduce((sum, booking) => sum + booking.totalAmount, 0) ?? 0;
  const activeBookings = bookings?.filter((booking) => booking.status === "active").length ?? 0;
  const completedBookings = bookings?.filter((booking) => booking.status === "completed").length ?? 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 space-y-6 p-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
            <p className="text-muted-foreground">Track your parking sessions by title, location, date, time, amount, and status.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-9">
              <Calendar className="h-4 w-4 mr-1" />
              {bookings?.length ?? 0} total
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-muted-foreground mt-1">All booking payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently parked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">Finished sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Spending Trend</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings?.length ? "Available" : "No data"}</div>
              <p className="text-xs text-muted-foreground mt-1">Based on booking history</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking List</CardTitle>
            <CardDescription>Search and filter your parking bookings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search title, location, date, or time"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as BookingStatusFilter)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                {statusFilters.map((status) => (
                  <option key={status} value={status}>
                    {status[0].toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Car className="h-10 w-10 mb-3 opacity-60" />
                <p className="font-medium">No bookings found</p>
                <p className="text-sm">Try changing your search or status filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredBookings.map((booking) => (
                  <Card key={booking.title} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{booking.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {booking.location}
                          </CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border bg-muted/40 p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Date
                        </div>
                        <p className="font-semibold">{booking.date}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/40 p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Clock className="h-3.5 w-3.5" />
                          Time
                        </div>
                        <p className="font-semibold">{booking.time}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/40 p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <CreditCard className="h-3.5 w-3.5" />
                          Amount
                        </div>
                        <p className="font-semibold">{booking.amount}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/40 p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Car className="h-3.5 w-3.5" />
                          Status
                        </div>
                        <p className="font-semibold capitalize">{booking.status}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
