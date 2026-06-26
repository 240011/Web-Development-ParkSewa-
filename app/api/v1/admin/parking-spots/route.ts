import { NextRequest } from "next/server";
import { createParkingSpotRoute } from "../../../../backend/src/routes/parking-spot.route";

export async function POST(request: NextRequest) {
    return createParkingSpotRoute(request);
}
