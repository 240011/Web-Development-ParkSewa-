import { NextRequest } from "next/server";
import { adminUpdatePromoRoute, adminDeletePromoRoute } from "../../../../../backend/src/routes/promo.route";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return adminUpdatePromoRoute(request, id);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return adminDeletePromoRoute(request, id);
}
