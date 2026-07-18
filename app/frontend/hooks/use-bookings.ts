"use client";

import { useQuery } from "@tanstack/react-query";

export interface Booking {
  id: string;
  spot?: {
    name: string;
    images?: string[];
    pricePerHour?: number;
    bikePrice?: number;
    carPrice?: number;
    truckPrice?: number;
  };
  vehicleNumber: string;
  vehicleType?: string;
  startTime: string;
  endTime?: string;
  totalAmount: number;
  status: "active" | "pending" | "completed" | "cancelled";
}

export function getListBookingsQueryKey() {
  return ["bookings"] as const;
}

export function useListBookings() {
  return useQuery({
    queryKey: getListBookingsQueryKey(),
    queryFn: async (): Promise<Booking[]> => {
      try {
        const res = await fetch("/api/v1/bookings", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch bookings");
        }
        const json = await res.json();
        return Array.isArray(json?.data) ? json.data : [];
      } catch {
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}