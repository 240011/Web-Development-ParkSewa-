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
    list: (lat?: number, lng?: number) => {
      const params = new URLSearchParams();
      if (lat !== undefined) params.set("lat", lat.toString());
      if (lng !== undefined) params.set("lng", lng.toString());
      const queryString = params.toString();
      return queryString ? `/api/v1/parking-spots?${queryString}` : "/api/v1/parking-spots";
    },
    detail: (id: string) => `/api/v1/parking-spots/${id}`,
    adminList: "/api/v1/admin/parking-spots",
    adminDetail: (id: string) => `/api/v1/admin/parking-spots/${id}`,
  },
  promos: {
    list: "/api/v1/promos",
    validate: "/api/v1/promos/validate",
    adminList: "/api/v1/admin/promos",
    adminGenerate: "/api/v1/admin/promos/generate",
  },
  notifications: {
    list: "/api/v1/notifications",
    markRead: "/api/v1/notifications/read",
    detail: (id: string) => `/api/v1/notifications/${id}`,
  },
  adminNotifications: {
    list: "/api/v1/admin/notifications",
    send: "/api/v1/admin/notifications",
    detail: (id: string) => `/api/v1/admin/notifications/${id}`,
  },
  chat: {
    send: "/api/v1/chat",
  },
  users: {
    adminList: "/api/v1/admin/users",
  },
} as const;
