import { NextRequest } from "next/server";
import { getBookingByIdRoute } from "../../../../backend/src/routes/booking.route";

export async function GET(request: NextRequest) {
  return getBookingByIdRoute(request);
}