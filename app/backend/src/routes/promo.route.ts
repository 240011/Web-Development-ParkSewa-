import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../configs/database";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";
import { getTokenFromRequest, verifyToken } from "../configs/auth";
import { PromoRepository } from "../repositories/promo.repository";
import { z } from "zod";

const promoRepository = new PromoRepository();

export async function listPromosRoute(request: NextRequest) {
  await connectDB();

  try {
    const onlyActive = request.nextUrl.searchParams.get("active") === "true";
    const promos = await promoRepository.list(onlyActive ? "active" : undefined);
    
return NextResponse.json(
      ApiResponseHelper.success(
        promos.map((promo) => ({
          id: String(promo._id),
          code: promo.code,
          description: promo.description,
          discountType: promo.discountType,
          value: promo.value,
          expiryDate: promo.expiryDate?.toISOString(),
          usageLimit: promo.usageLimit,
          usageCount: promo.usageCount,
          minBookingAmount: promo.minBookingAmount,
          isActive: promo.isActive,
          createdAt: promo.createdAt?.toISOString(),
          updatedAt: promo.updatedAt?.toISOString(),
        })),
        "Promos retrieved successfully",
        200
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch promos";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}

export async function validatePromoRoute(request: NextRequest) {
  await connectDB();

  try {
    const body = (await request.json()) as { code?: string; bookingAmount?: number };
    const code = body.code?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json(ApiResponseHelper.error("Promo code is required", 400), { status: 400 });
    }

    const promo = await promoRepository.findByCode(code);
    if (!promo) {
      return NextResponse.json(ApiResponseHelper.error("Invalid promo code", 404), { status: 404 });
    }

    if (!promo.isActive) {
      return NextResponse.json(ApiResponseHelper.error("This promo code is inactive", 400), { status: 400 });
    }

    if (promo.expiryDate < new Date()) {
      return NextResponse.json(ApiResponseHelper.error("This promo code has expired", 400), { status: 400 });
    }

    if (promo.usageCount >= promo.usageLimit) {
      return NextResponse.json(ApiResponseHelper.error("Usage limit exceeded for this promo code", 400), { status: 400 });
    }

    if ((body.bookingAmount ?? 0) < promo.minBookingAmount) {
      return NextResponse.json(
        ApiResponseHelper.error(`Minimum booking amount of ${promo.minBookingAmount} is required`, 400),
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (promo.discountType === "percentage") {
      discountAmount = Math.round(((body.bookingAmount ?? 0) * promo.value) / 100);
    } else {
      discountAmount = Math.min(promo.value, body.bookingAmount ?? 0);
    }

    return NextResponse.json(
      ApiResponseHelper.success(
        {
          id: String(promo._id),
          code: promo.code,
          description: promo.description,
          discountType: promo.discountType,
          value: promo.value,
          discountAmount,
          minBookingAmount: promo.minBookingAmount,
        },
        "Promo applied successfully",
        200
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to validate promo";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}

const createPromoSchema = z.object({
  code: z.string().trim().min(1, "Code is required").toUpperCase(),
  description: z.string().trim().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  value: z.number().min(0, "Value must be non-negative"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  usageLimit: z.number().int().min(0).default(100),
  minBookingAmount: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export async function adminListPromosRoute(request: NextRequest) {
  await connectDB();

  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(ApiResponseHelper.error("Unauthorized", 401), { status: 401 });
  }

  try {
    const payload = verifyToken<{ role?: string }>(token);
    if (payload.role !== "admin") {
      return NextResponse.json(ApiResponseHelper.error("Forbidden", 403), { status: 403 });
    }
  } catch {
    return NextResponse.json(ApiResponseHelper.error("Invalid token", 401), { status: 401 });
  }

  try {
    const promos = await promoRepository.list();
    return NextResponse.json(
      ApiResponseHelper.success(
        promos.map((promo) => ({
          id: String(promo._id),
          code: promo.code,
          description: promo.description,
          discountType: promo.discountType,
          value: promo.value,
          expiryDate: promo.expiryDate?.toISOString(),
          usageLimit: promo.usageLimit,
          usageCount: promo.usageCount,
          minBookingAmount: promo.minBookingAmount,
          isActive: promo.isActive,
          createdAt: promo.createdAt?.toISOString(),
          updatedAt: promo.updatedAt?.toISOString(),
        })),
        "Promos retrieved successfully",
        200
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch promos";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}

export async function adminCreatePromoRoute(request: NextRequest) {
  await connectDB();

  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(ApiResponseHelper.error("Unauthorized", 401), { status: 401 });
  }

  try {
    const payload = verifyToken<{ role?: string }>(token);
    if (payload.role !== "admin") {
      return NextResponse.json(ApiResponseHelper.error("Forbidden", 403), { status: 403 });
    }
  } catch {
    return NextResponse.json(ApiResponseHelper.error("Invalid token", 401), { status: 401 });
  }

  try {
    const body = await request.json() as any;
    const validatedData = createPromoSchema.parse(body);

    const existing = await promoRepository.findByCode(validatedData.code);
    if (existing) {
      return NextResponse.json(ApiResponseHelper.error("Promo code already exists", 409), { status: 409 });
    }

    const promo = await promoRepository.create({
      ...validatedData,
      expiryDate: new Date(validatedData.expiryDate),
    });

    return NextResponse.json(
      ApiResponseHelper.success(
        {
          id: String(promo._id),
          code: promo.code,
          description: promo.description,
          discountType: promo.discountType,
          value: promo.value,
          expiryDate: promo.expiryDate?.toISOString(),
          usageLimit: promo.usageLimit,
          usageCount: promo.usageCount,
          minBookingAmount: promo.minBookingAmount,
          isActive: promo.isActive,
          createdAt: promo.createdAt?.toISOString(),
          updatedAt: promo.updatedAt?.toISOString(),
        },
        "Promo created successfully",
        201
      ),
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
      const message = issues.map((e) => `${e.path.join(".") || "field"}: ${e.message}`).join(", ");
      return NextResponse.json(ApiResponseHelper.error(message, 400), { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Failed to create promo";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}

export async function adminUpdatePromoRoute(request: NextRequest, id: string) {
  await connectDB();

  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(ApiResponseHelper.error("Unauthorized", 401), { status: 401 });
  }

  try {
    const payload = verifyToken<{ role?: string }>(token);
    if (payload.role !== "admin") {
      return NextResponse.json(ApiResponseHelper.error("Forbidden", 403), { status: 403 });
    }
  } catch {
    return NextResponse.json(ApiResponseHelper.error("Invalid token", 401), { status: 401 });
  }

  try {
    const promo = await promoRepository.findById(id);
    if (!promo) {
      return NextResponse.json(ApiResponseHelper.error("Promo not found", 404), { status: 404 });
    }

    const body = await request.json() as any;
    const updateData: Record<string, unknown> = {};

    if (body.code !== undefined) {
      const code = String(body.code).trim().toUpperCase();
      const existingWithCode = await promoRepository.findByCode(code);
      if (existingWithCode && String(existingWithCode._id) !== id) {
        return NextResponse.json(ApiResponseHelper.error("Promo code already exists", 409), { status: 409 });
      }
      updateData.code = code;
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.value !== undefined) updateData.value = Number(body.value);
    if (body.expiryDate !== undefined) updateData.expiryDate = new Date(body.expiryDate);
    if (body.usageLimit !== undefined) updateData.usageLimit = Number(body.usageLimit);
    if (body.minBookingAmount !== undefined) updateData.minBookingAmount = Number(body.minBookingAmount);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const updated = await promoRepository.findByIdAndUpdate(id, updateData);
    if (!updated) {
      return NextResponse.json(ApiResponseHelper.error("Promo not found", 404), { status: 404 });
    }

    return NextResponse.json(
      ApiResponseHelper.success(
        {
          id: String(updated._id),
          code: updated.code,
          description: updated.description,
          discountType: updated.discountType,
          value: updated.value,
          expiryDate: updated.expiryDate?.toISOString(),
          usageLimit: updated.usageLimit,
          usageCount: updated.usageCount,
          minBookingAmount: updated.minBookingAmount,
          isActive: updated.isActive,
          createdAt: updated.createdAt?.toISOString(),
          updatedAt: updated.updatedAt?.toISOString(),
        },
        "Promo updated successfully",
        200
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update promo";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}

export async function adminDeletePromoRoute(request: NextRequest, id: string) {
  await connectDB();

  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(ApiResponseHelper.error("Unauthorized", 401), { status: 401 });
  }

  try {
    const payload = verifyToken<{ role?: string }>(token);
    if (payload.role !== "admin") {
      return NextResponse.json(ApiResponseHelper.error("Forbidden", 403), { status: 403 });
    }
  } catch {
    return NextResponse.json(ApiResponseHelper.error("Invalid token", 401), { status: 401 });
  }

  try {
    const promo = await promoRepository.delete(id);
    if (!promo) {
      return NextResponse.json(ApiResponseHelper.error("Promo not found", 404), { status: 404 });
    }

    return NextResponse.json(ApiResponseHelper.success({ id }, "Promo deleted successfully", 200), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete promo";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}

const generatePromoSchema = z.object({
  count: z.number().int().min(1).max(100).default(5),
  prefix: z.string().trim().optional(),
  length: z.number().int().min(4).max(20).default(8),
  discountType: z.enum(["percentage", "fixed"]),
  value: z.number().min(0),
  expiryDate: z.string().min(1),
  usageLimit: z.number().int().min(0).default(100),
  minBookingAmount: z.number().min(0).default(0),
});

export async function adminGeneratePromosRoute(request: NextRequest) {
  await connectDB();

  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(ApiResponseHelper.error("Unauthorized", 401), { status: 401 });
  }

  try {
    const payload = verifyToken<{ role?: string }>(token);
    if (payload.role !== "admin") {
      return NextResponse.json(ApiResponseHelper.error("Forbidden", 403), { status: 403 });
    }
  } catch {
    return NextResponse.json(ApiResponseHelper.error("Invalid token", 401), { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = generatePromoSchema.parse(body);

    const created: unknown[] = [];
    for (let i = 0; i < validatedData.count; i++) {
      const suffix = Array.from({ length: validatedData.length - (validatedData.prefix?.length || 0) }, () =>
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
      ).join("");

      const code = `${validatedData.prefix ?? "PSW"}${suffix}`.toUpperCase().slice(0, validatedData.length);

      const existing = await promoRepository.findByCode(code);
      if (!existing) {
        const promo = await promoRepository.create({
          code,
          discountType: validatedData.discountType,
          value: validatedData.value,
          expiryDate: new Date(validatedData.expiryDate),
          usageLimit: validatedData.usageLimit,
          minBookingAmount: validatedData.minBookingAmount,
          isActive: true,
        });
        created.push(promo);
      }
    }

    return NextResponse.json(
      ApiResponseHelper.success(created, `${created.length} promo codes generated`, 201),
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
      const message = issues.map((e) => `${e.path.join(".") || "field"}: ${e.message}`).join(", ");
      return NextResponse.json(ApiResponseHelper.error(message, 400), { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Failed to generate promos";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}
