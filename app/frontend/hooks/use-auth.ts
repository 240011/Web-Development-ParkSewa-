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
       // Try to fetch from backend, fallback to checking token in localStorage
       try {
         const res = await fetch("/api/v1/auth/current-user");
         if (!res.ok) {
           if (res.status === 401) return null;
           throw new Error("Failed to fetch user");
         }
         return res.json() as Promise<User>;
       } catch (error) {
         // If API call fails, check if we have a token in localStorage
         const token = localStorage.getItem("token");
         if (token) {
           // Decode JWT token to get user info (without verification for client-side)
           try {
             const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
             return {
               id: Number(payload.userId) || 1,
               name: payload.full_name || 'John Doe',
               email: payload.email,
               phone: payload.phone || '',
               vehicleNumber: payload.vehicle_number || '',
               vehicleType: payload.vehicle_type || 'car',
               role: payload.role || 'user'
             } as User;
           } catch (decodeError) {
             // If token decoding fails, return null
             return null;
           }
         }
         return null;
       }
     },
    staleTime: 5 * 60 * 1000,
  });

  const mockUser: User = { id: 1, name: "John Doe", email: "john@example.com", phone: "9800000000", vehicleNumber: "BA 1 PA 1234", vehicleType: "car", role: "user" };
   
  return { user: user ?? mockUser, isLoading: false };
}