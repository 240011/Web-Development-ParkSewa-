import { NextRequest } from "next/server";
import { requestPasswordResetRoute } from "../../../../backend/src/routes/auth.route";

export async function POST(request: NextRequest) {
  return requestPasswordResetRoute(request);
}