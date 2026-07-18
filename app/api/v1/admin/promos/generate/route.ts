import { NextRequest } from "next/server";
import { adminGeneratePromosRoute } from "../../../../../backend/src/routes/promo.route";

export async function POST(request: NextRequest) {
  return adminGeneratePromosRoute(request);
}
