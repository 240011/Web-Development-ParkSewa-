import { NextRequest } from "next/server";
import { PromoController } from "../controllers/promo.controller";

const promoController = new PromoController();

export async function listPromosRoute(request: NextRequest) {
  return promoController.listPromos(request);
}

export async function validatePromoRoute(request: NextRequest) {
  return promoController.validatePromo(request);
}

export async function adminListPromosRoute(request: NextRequest) {
  return promoController.adminListPromos(request);
}

export async function adminCreatePromoRoute(request: NextRequest) {
  return promoController.adminCreatePromo(request);
}

export async function adminUpdatePromoRoute(request: NextRequest, id: string) {
  return promoController.adminUpdatePromo(request, id);
}

export async function adminDeletePromoRoute(request: NextRequest, id: string) {
  return promoController.adminDeletePromo(request, id);
}

export async function adminGeneratePromosRoute(request: NextRequest) {
  return promoController.adminGeneratePromos(request);
}
