"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  role: "user" | "admin";
}

export function getGetCurrentUserQueryKey() {
  return ["currentUser"] as const;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: getGetCurrentUserQueryKey(),
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/current-user", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
        return null;
      }
      const json = await res.json() as { data: { _id: string; full_name: string; email: string; phone: string; vehicle_number: string; vehicle_type: string; role: string } };
      if (!json.data) return null;
      return {
        id: Number(json.data._id),
        name: json.data.full_name,
        email: json.data.email,
        phone: json.data.phone,
        vehicleNumber: json.data.vehicle_number,
        vehicleType: json.data.vehicle_type,
        role: json.data.role,
      } as User;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { user: user ?? null, isLoading };
}