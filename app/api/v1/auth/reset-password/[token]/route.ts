import { NextRequest } from "next/server";
import { resetPasswordRoute } from "../../../../../backend/src/routes/auth.route";

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const params = await context.params;
  return resetPasswordRoute(request, { params });
}