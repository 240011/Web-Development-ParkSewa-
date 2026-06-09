import { NextRequest, NextResponse } from "next/server";

const dashboardPrefixes = ["/frontend/dashboard", "/frontend/spots", "/frontend/bookings"];
const publicPrefixes = ["/frontend/login", "/frontend/register"];

export default async function proxy(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const { pathname } = request.nextUrl;

    const isDashboard = dashboardPrefixes.some((p) => pathname.startsWith(p));
    const isPublic = publicPrefixes.some((p) => pathname.startsWith(p));

    if (!token && !isPublic && pathname !== "/" && pathname !== "/frontend") {
        return NextResponse.redirect(new URL("/frontend/login", request.url));
    }

    if (token && (isPublic || pathname === "/" || pathname === "/frontend")) {
        return NextResponse.redirect(new URL("/frontend/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/frontend/:path*",
        "/dashboard/:path*",
        "/login/:path*",
        "/register/:path*",
    ],
};
