import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";
import { HttpException } from "../exceptions/HttpException";

export type UserRole = "user" | "admin";

export interface AuthenticatedUser {
  id?: string;
  userId?: string;
  role: UserRole;
  [key: string]: unknown;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW_MS = 60000;

export function adminMiddleware(
  req: NextRequest,
  next: () => Promise<NextResponse>
) {
  try {
    const user = (req as NextRequest & { user?: AuthenticatedUser }).user;

    if (!user) {
      return NextResponse.json(
        ApiResponseHelper.error("Unauthorized - No user found", 401),
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        ApiResponseHelper.error("Forbidden - Insufficient permissions", 403),
        { status: 403 }
      );
    }

    return next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json(
      ApiResponseHelper.error(message, 403),
      { status: 403 }
    );
  }
}

export function userMiddleware(
  req: NextRequest,
  next: () => Promise<NextResponse>
) {
  try {
    const user = (req as NextRequest & { user?: AuthenticatedUser }).user;

    if (!user) {
      return NextResponse.json(
        ApiResponseHelper.error("Unauthorized - No user found", 401),
        { status: 401 }
      );
    }

    if (user.role !== "user" && user.role !== "admin") {
      return NextResponse.json(
        ApiResponseHelper.error("Forbidden - Insufficient permissions", 403),
        { status: 403 }
      );
    }

    return next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json(
      ApiResponseHelper.error(message, 403),
      { status: 403 }
    );
  }
}

export function roleMiddleware(requiredRole: UserRole) {
  return async (req: NextRequest, next: () => Promise<NextResponse>) => {
    try {
      const user = (req as NextRequest & { user?: AuthenticatedUser }).user;

      if (!user) {
        return NextResponse.json(
          ApiResponseHelper.error("Unauthorized - No user found", 401),
          { status: 401 }
        );
      }

      if (user.role !== requiredRole) {
        return NextResponse.json(
          ApiResponseHelper.error("Forbidden - Insufficient permissions", 403),
          { status: 403 }
        );
      }

      return await next();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Forbidden";
      return NextResponse.json(
        ApiResponseHelper.error(message, 403),
        { status: 403 }
      );
    }
  };
}

export function rateLimitMiddleware(
  maxRequests: number = RATE_LIMIT,
  windowMs: number = RATE_LIMIT_WINDOW_MS
) {
  return async (req: NextRequest, next: () => Promise<NextResponse>) => {
    try {
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      const now = Date.now();

      const entry = rateLimitStore.get(ip);

      if (!entry || now > entry.resetTime) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
        return await next();
      }

      if (entry.count >= maxRequests) {
        const response = NextResponse.json(
          ApiResponseHelper.error("Too Many Requests", 429),
          { status: 429 }
        );
        response.headers.set("Retry-After", Math.ceil((entry.resetTime - now) / 1000).toString());
        return response;
      }

      entry.count += 1;
      return await next();
    } catch {
      return NextResponse.json(
        ApiResponseHelper.error("Rate limit error", 500),
        { status: 500 }
      );
    }
  };
}

export function validationMiddleware<T>(schema: ZodSchema<T>) {
  return async (req: NextRequest, next: (validatedData: T) => Promise<NextResponse>) => {
    try {
      const body = await req.json();
      const validatedData = schema.parse(body);
      return await next(validatedData);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "issues" in error) {
        const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
        const errorDetails = issues.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        }));
        return NextResponse.json(
          ApiResponseHelper.error(
            `Validation failed: ${JSON.stringify(errorDetails)}`,
            400
          ),
          { status: 400 }
        );
      }

      const message = error instanceof Error ? error.message : "Validation failed";
      return NextResponse.json(
        ApiResponseHelper.error(message, 400),
        { status: 400 }
      );
    }
  };
}

export async function loggingMiddleware(
  req: NextRequest,
  next: () => Promise<NextResponse>
) {
  try {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.nextUrl.pathname;

    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("token")?.value;
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    const enrichedReq = req as NextRequest & { user?: AuthenticatedUser };

    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString()) as AuthenticatedUser;
        enrichedReq.user = payload;
      } catch {
        enrichedReq.user = undefined;
      }
    }

    console.log(`[${timestamp}] ${method} ${url}${enrichedReq.user ? ` - User: ${enrichedReq.user.userId || enrichedReq.user.id}` : ""}`);

    return await next();
  } catch {
    return NextResponse.json(
      ApiResponseHelper.error("Logging error", 500),
      { status: 500 }
    );
  }
}

export async function errorHandler(
  error: Error
): Promise<NextResponse> {
  console.error(`[Error] ${error.name}: ${error.message}`, error.stack);

  let statusCode = 500;
  let message = "Internal Server Error";

  if (error instanceof HttpException) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === "ZodError") {
    statusCode = 400;
    message = "Validation failed";
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  return NextResponse.json(
    ApiResponseHelper.error(message, statusCode),
    { status: statusCode }
  );
}