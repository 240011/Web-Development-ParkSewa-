"use client";

import { useQuery } from "@tanstack/react-query";

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
  const { data: user } = useQuery({
    queryKey: getGetCurrentUserQueryKey(),
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch user");
      }
      return res.json() as Promise<User>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const mockUser: User = { id: 1, name: "John Doe", email: "john@example.com", phone: "9800000000", vehicleNumber: "BA 1 PA 1234", vehicleType: "car", role: "user" };
  
  return { user: user ?? mockUser, isLoading: false };
}