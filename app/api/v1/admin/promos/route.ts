import { NextRequest } from "next/server";
import { adminListPromosRoute, adminCreatePromoRoute } from "../../../../backend/src/routes/promo.route";

export async function GET(request: NextRequest) {
  return adminListPromosRoute(request);
}

export async function POST(request: NextRequest) {
  return adminCreatePromoRoute(request);
}
