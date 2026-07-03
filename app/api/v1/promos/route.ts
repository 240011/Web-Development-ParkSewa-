import { NextRequest } from "next/server";
import { listPromosRoute } from "../../../backend/src/routes/promo.route";

export async function GET(request: NextRequest) {
  return listPromosRoute(request);
}
