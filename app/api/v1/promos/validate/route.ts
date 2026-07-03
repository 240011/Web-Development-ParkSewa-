import { NextRequest } from "next/server";
import { validatePromoRoute } from "../../../../backend/src/routes/promo.route";

export async function POST(request: NextRequest) {
  return validatePromoRoute(request);
}
