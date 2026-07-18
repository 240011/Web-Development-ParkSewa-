"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useListBookings, Booking } from "@/hooks/use-bookings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { Car, MapPin, ArrowRight, ImageOff } from "lucide-react";
import Sidebar from "../components/app-sidebar";

const mockBookings: Booking[] = [
  { id: "1", spot: { name: "Downtown Parking" }, vehicleNumber: "BA 1 PA 1234", startTime: "2024-01-15T10:00:00Z", totalAmount: 500, status: "active" },
  { id: "2", spot: { name: "Mall Parking" }, vehicleNumber: "BA 1 PA 1234", startTime: "2024-01-14T10:00:00Z", totalAmount: 300, status: "completed" },
];

export default function Dashboard() {
  const { user } = useAuth();
   
  const { data: bookings } = useListBookings() as { data: Booking[] | undefined };

  const displayBookings = Array.isArray(bookings) ? bookings : mockBookings;
  const activeBookings = displayBookings?.filter(b => b.status === "active" || b.status === "pending") || [];
  const recentBookings = displayBookings?.slice(0, 3) || [];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
            <p className="text-muted-foreground">Manage your parking and bookings easily.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/frontend/spots">
              <Button className="gap-2">
                <MapPin className="h-4 w-4" />
                Find Parking
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Your latest parking activity</CardDescription>
                </div>
                <Link href="/frontend/bookings">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center gap-3 p-3 rounded-lg border-l-4 transition-colors hover:bg-accent/5">
                      <Link href="/frontend/bookings" className="block flex-shrink-0">
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                          {booking.spot?.images?.[0] ? (
                            <img src={booking.spot.images[0]} alt={booking.spot?.name || "Parking spot"} className="h-full w-full object-cover" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src = '/default-spot-image.png'; }} />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <ImageOff className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{booking.spot?.name || "Parking Spot"}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(booking.startTime)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-medium text-sm">{formatCurrency(booking.totalAmount)}</div>
                        <div className={`text-[10px] capitalize font-medium ${
                          booking.status === 'completed' ? 'text-green-600' : 
                          booking.status === 'active' ? 'text-blue-600' : 
                          booking.status === 'cancelled' ? 'text-red-600' : 
                          'text-yellow-600'
                        }`}>
                          {booking.status}
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentBookings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Car className="h-8 w-8 mx-auto mb-2 opacity-60" />
                      <p className="text-sm">No recent bookings</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground border-none">
              <CardHeader>
                <CardTitle className="text-primary-foreground">Quick Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/frontend/spots" className="block">
                  <Button variant="secondary" className="w-full justify-start h-auto p-4 flex flex-col items-start gap-2 group">
                    <MapPin className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Find Nearby Spots</div>
                      <div className="text-sm font-normal opacity-80">Book parking instantly</div>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {activeBookings.length > 0 && (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    Active Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="font-medium text-lg">{activeBookings[0].spot?.name}</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vehicle:</span>
                      <span className="font-medium">{activeBookings[0].vehicleNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Started:</span>
                      <span className="font-medium">{formatDate(activeBookings[0].startTime)}</span>
                    </div>
                    <Link href={`/frontend/bookings/${activeBookings[0].id}`} className="block mt-4">
                      <Button variant="outline" className="w-full">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
