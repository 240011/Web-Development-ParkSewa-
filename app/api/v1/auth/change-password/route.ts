import { NextRequest } from "next/server";
import { changePasswordRoute } from "../../../../backend/src/routes/auth.route";

export async function POST(request: NextRequest) {
  return changePasswordRoute(request);
}
