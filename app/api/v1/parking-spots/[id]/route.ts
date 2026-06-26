import { NextRequest } from "next/server";
import { getParkingSpotRoute } from "../../../../backend/src/routes/parking-spot.route";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return getParkingSpotRoute(request, id);
}