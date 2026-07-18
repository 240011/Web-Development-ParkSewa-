"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { CheckCircle, Calendar, Clock, MapPin, Car, ArrowRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

function BookingConfirmation() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/bookings/${bookingId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load booking");
      const json = (await res.json()) as { data?: { 
        id: string; 
        spot?: { name: string; images?: string[] };
        vehicleNumber: string;
        vehicleType?: string;
        startTime: string;
        endTime?: string;
        totalAmount: number;
        status: string;
        promoCode?: string;
      }};
      return json.data;
    },
    enabled: !!bookingId,
  });

  if (!bookingId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Booking Not Found</CardTitle>
            <CardDescription>No booking ID was provided.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/frontend/spots">
              <Button className="w-full">Find Parking</Button>
            </Link>
            <Link href="/frontend/dashboard">
              <Button variant="outline" className="w-full">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <p className="text-lg font-medium">Loading booking details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Booking Not Found</CardTitle>
            <CardDescription>The booking could not be found or has expired.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/frontend/spots">
              <Button className="w-full">Find Another Spot</Button>
            </Link>
            <Link href="/frontend/dashboard">
              <Button variant="outline" className="w-full">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 dark:bg-green-950/10">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center pb-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          <CardDescription>Your parking session has been booked successfully.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{booking.spot?.name || "Parking Spot"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(booking.startTime)}</span>
            </div>
            {booking.endTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatDate(booking.endTime)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              <span className="capitalize">{booking.vehicleType || "Vehicle"} - {booking.vehicleNumber}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="text-lg font-bold">{formatCurrency(booking.totalAmount)}</span>
              </div>
              {booking.promoCode && (
                <p className="text-xs text-green-600 mt-1">Promo {booking.promoCode} applied</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link href="/frontend/bookings">
              <Button className="w-full gap-2">
                View My Bookings <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/frontend/dashboard">
              <Button variant="outline" className="w-full gap-2">
                <Home className="h-4 w-4" /> Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <CheckCircle className="h-8 w-8 animate-spin text-green-600" />
      </div>
    }>
      <BookingConfirmation />
    </Suspense>
  );
}
