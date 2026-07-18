import { NextRequest } from "next/server";
import { getParkingSpotsRoute } from "../../../backend/src/routes/parking-spot.route";

export async function GET(request: NextRequest) {
    return getParkingSpotsRoute(request);
}