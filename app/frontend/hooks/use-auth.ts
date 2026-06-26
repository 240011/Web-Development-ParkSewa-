"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AUTH } from "@/lib/auth-config";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  profileImageUrl: string | null;
  role: "user" | "admin";
  createdAt: string;
}

export function getGetCurrentUserQueryKey() {
  return ["currentUser"] as const;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: getGetCurrentUserQueryKey(),
    queryFn: async () => {
      const res = await fetch(AUTH.WHOAMI, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
        return null;
      }
      const json = await res.json() as { data: { _id: string; full_name: string; email: string; phone: string; vehicle_number: string; vehicle_type: string; profile_image_url: string | null; role: string; createdAt: string } };
      if (!json.data) return null;
      return {
        id: json.data._id,
        name: json.data.full_name,
        email: json.data.email,
        phone: json.data.phone,
        vehicleNumber: json.data.vehicle_number,
        vehicleType: json.data.vehicle_type,
        profileImageUrl: json.data.profile_image_url ?? null,
        role: json.data.role,
        createdAt: json.data.createdAt,
      } as User;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { user: user ?? null, isLoading };
}