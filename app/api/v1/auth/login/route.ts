import { NextRequest } from "next/server";
import { loginRoute } from "../../../../backend/src/routes/auth.route";

export async function POST(request: NextRequest) {
    return loginRoute(request);
}