"use client";

import { useQuery } from "@tanstack/react-query";

export interface Booking {
  id: number;
  spot?: {
    name: string;
  };
  vehicleNumber: string;
  startTime: string;
  totalAmount: number;
  status: "active" | "pending" | "completed" | "cancelled";
}

export function getListBookingsQueryKey() {
  return ["bookings"] as const;
}

export function useListBookings() {
  return useQuery({
    queryKey: getListBookingsQueryKey(),
    queryFn: async () => {
      try {
        const res = await fetch("/api/v1/bookings");
        if (!res.ok) {
          // If API fails, we'll fall back to mock data in the component
          throw new Error("Failed to fetch bookings");
        }
        return res.json() as Promise<Booking[]>;
      } catch (error) {
        // Return empty array to trigger fallback to mock data in dashboard
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}