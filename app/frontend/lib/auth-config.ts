export const AUTH_COOKIE = {
  name: "token",
  maxAge: 3600,
} as const;

export const AUTH = {
  WHOAMI: "/api/v1/auth/current-user",
} as const;
