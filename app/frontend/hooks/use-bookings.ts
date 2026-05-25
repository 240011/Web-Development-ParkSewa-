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
      const res = await fetch("/api/bookings");
      if (!res.ok) {
        throw new Error("Failed to fetch bookings");
      }
      return res.json() as Promise<Booking[]>;
    },
    staleTime: 2 * 60 * 1000,
  });
}