import { NextRequest } from "next/server";
import { deleteParkingSpotRoute, updateParkingSpotRoute } from "../../../../../backend/src/routes/parking-spot.route";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return updateParkingSpotRoute(request, id);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return deleteParkingSpotRoute(request, id);
}