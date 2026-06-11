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
    queryFn: async (): Promise<Booking[]> => {
      try {
        const res = await fetch("/api/v1/bookings");
        if (!res.ok) {
          throw new Error("Failed to fetch bookings");
        }
        const json = await res.json();
        return Array.isArray(json?.data) ? json.data : [];
      } catch (error) {
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}