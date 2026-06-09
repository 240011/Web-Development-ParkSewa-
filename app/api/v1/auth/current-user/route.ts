import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserRoute } from "../../../../backend/src/routes/user.route";

export async function GET(request: NextRequest) {
    return getCurrentUserRoute(request);
}
