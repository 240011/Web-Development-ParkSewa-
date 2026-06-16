export const ENDPOINTS = {
  auth: {
    register: "/api/v1/auth/register",
    login: "/api/v1/auth/login",
    logout: "/api/v1/auth/logout",
    changePassword: "/api/v1/auth/change-password",
    me: "/api/v1/auth/current-user",
  },
} as const;
