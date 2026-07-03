import { NextRequest } from "next/server";
import { getBookingsRoute, createBookingRoute } from "../../../backend/src/routes/booking.route";

export async function GET(request: NextRequest) {
    return getBookingsRoute(request);
}

export async function POST(request: NextRequest) {
    return createBookingRoute(request);
}