import { NextRequest, NextResponse } from "next/server";
import { registerRoute } from "../../../../backend/src/routes/auth.route";

export async function POST(request: NextRequest) {
    return registerRoute(request);
}