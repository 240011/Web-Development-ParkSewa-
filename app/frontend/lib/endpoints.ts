import { AUTH } from "./auth-config";

export const ENDPOINTS = {
  auth: {
    ...AUTH,
    register: "/api/v1/auth/register",
    login: "/api/v1/auth/login",
    logout: "/api/v1/auth/logout",
    changePassword: "/api/v1/auth/change-password",
    requestPasswordReset: "/api/v1/auth/request-password-reset",
    resetPassword: (token: string) => `/api/v1/auth/reset-password/${token}`,
  },
  parkingSpots: {
    list: "/api/v1/parking-spots",
    detail: (id: string) => `/api/v1/parking-spots/${id}`,
    adminList: "/api/v1/admin/parking-spots",
    adminDetail: (id: string) => `/api/v1/admin/parking-spots/${id}`,
  },
} as const;
