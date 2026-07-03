import { NextRequest } from "next/server";
import { adminGetBookingsRoute } from "../../../../backend/src/routes/booking.route";

export async function GET(request: NextRequest) {
    return adminGetBookingsRoute(request);
}