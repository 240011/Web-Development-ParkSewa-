"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useListBookings, Booking } from "@/hooks/use-bookings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { Car, Clock, MapPin, ArrowRight } from "lucide-react";
import Sidebar from "../components/app-sidebar";

const mockBookings: Booking[] = [
  { id: 1, spot: { name: "Downtown Parking" }, vehicleNumber: "BA 1 PA 1234", startTime: "2024-01-15T10:00:00Z", totalAmount: 500, status: "active" },
  { id: 2, spot: { name: "Mall Parking" }, vehicleNumber: "BA 1 PA 1234", startTime: "2024-01-14T10:00:00Z", totalAmount: 300, status: "completed" },
];

export default function Dashboard() {
  const { user } = useAuth();
   
  const { data: bookings } = useListBookings() as { data: Booking[] | undefined };

  const displayBookings = Array.isArray(bookings) ? bookings : mockBookings;
  const activeBookings = displayBookings?.filter(b => b.status === "active" || b.status === "pending") || [];
  const recentBookings = displayBookings?.slice(0, 5) || [];

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
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-accent/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                            <Car className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold">{booking.spot?.name || "Parking Spot"}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(booking.startTime)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(booking.totalAmount)}</div>
                          <div className={`text-xs capitalize px-2 py-0.5 rounded-full inline-block mt-1 
                            ${booking.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                              booking.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                            {booking.status}
                          </div>
                        </div>
                      </div>
                    ))}
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