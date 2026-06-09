import { NextRequest } from "next/server";
import { getBookingsRoute } from "../../../backend/src/routes/booking.route";

export async function GET(_request: NextRequest) {
    return getBookingsRoute(_request);
}