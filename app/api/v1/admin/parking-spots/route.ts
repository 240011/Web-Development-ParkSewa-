import { NextRequest } from "next/server";
import { getParkingSpotsRoute } from "../../../../backend/src/routes/parking-spot.route";
import { createParkingSpotRoute } from "../../../../backend/src/routes/parking-spot.route";

export async function GET(request: NextRequest) {
    return getParkingSpotsRoute(request);
}

export async function POST(request: NextRequest) {
    return createParkingSpotRoute(request);
}
