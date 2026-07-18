import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "../configs/database";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";
import {
  getTokenFromRequest,
  verifyToken,
} from "../configs/auth";
import { ParkingSpotRepository } from "../repositories/parking-spot.repository";
import type { SpotStatus } from "../models/parking-spot.model";

const parkingSpotRepository = new ParkingSpotRepository();

const parkingSpotSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  address: z.string().trim().min(1, "Address is required"),
  location: z.string().trim().min(1, "Location is required"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  totalSlots: z.number().int().nonnegative("Total slots must be a non-negative number"),
  pricePerHour: z.number().nonnegative("Price per hour must be a non-negative number"),
  vehicleTypes: z.array(z.enum(["bike", "car", "truck"])).min(1, "Select at least one vehicle type"),
  status: z.enum(["active", "inactive"]).optional(),
  images: z.array(z.string().trim().min(1, "Image URL is required")).optional(),
});

function publicParkingSpot(spot: {
  _id: unknown;
  name: string;
  address: string;
  location: string;
  latitude?: number;
  longitude?: number;
  totalSlots: number;
  availableSlots: number;
  pricePerHour: number;
  vehicleTypes: string[];
  status: string;
  images: string[];
  distance?: number;
}, userLat?: number, userLng?: number) {
  const result: {
    id: string;
    name: string;
    address: string;
    location: string;
    latitude?: number;
    longitude?: number;
    distance?: number;
    totalSlots: number;
    availableSlots: number;
    pricePerHour: number;
    vehicleTypes: string[];
    status: string;
    images: string[];
  } = {
    id: String(spot._id),
    name: spot.name,
    address: spot.address,
    location: spot.location,
    latitude: spot.latitude,
    longitude: spot.longitude,
    totalSlots: spot.totalSlots,
    availableSlots: spot.availableSlots,
    pricePerHour: spot.pricePerHour,
    vehicleTypes: spot.vehicleTypes,
    status: spot.status,
    images: spot.images,
  };

  if (spot.distance !== undefined) {
    result.distance = spot.distance;
  } else if (userLat !== undefined && userLng !== undefined && spot.latitude !== undefined && spot.longitude !== undefined) {
    const R = 6371;
    const dLat = ((spot.latitude - userLat) * Math.PI) / 180;
    const dLng = ((spot.longitude - userLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLat * Math.PI) / 180) *
        Math.cos((spot.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    result.distance = Math.round((R * c) * 10) / 10;
  }

  return result;
}

function getToken(request: NextRequest) {
  return getTokenFromRequest(request);
}

async function getAdminUser(request: NextRequest) {
  const token = getToken(request);
  if (!token) return null;

  try {
    const payload = verifyToken<{ userId?: string; role?: string }>(token);
    if (payload.role !== "admin" || !payload.userId) return null;
    return { userId: payload.userId, role: "admin" as const };
  } catch {
    return null;
  }
}

async function requireAdmin(request: NextRequest) {
  const user = await getAdminUser(request);
  if (!user) {
    return NextResponse.json(
      ApiResponseHelper.error("Unauthorized - Admin token required", 401),
      { status: 401 }
    );
  }

  return null;
}

async function parseBody(request: NextRequest) {
  return parkingSpotSchema.parseAsync(request.body ? await request.json() : {});
}

export async function getParkingSpotsRoute(request: NextRequest) {
  await connectDB();

  try {
    const status = request.nextUrl.searchParams.get("status") as SpotStatus | null;
    const lat = request.nextUrl.searchParams.get("lat");
    const lng = request.nextUrl.searchParams.get("lng");
    const userLat = lat ? parseFloat(lat) : undefined;
    const userLng = lng ? parseFloat(lng) : undefined;

    let spots = await parkingSpotRepository.list(status ?? undefined);

    if (userLat !== undefined && userLng !== undefined) {
      spots = spots
        .map((spot) => ({
          ...(spot.toObject?.() ?? spot),
          distance: publicParkingSpot(spot, userLat, userLng).distance,
        }))
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    return NextResponse.json(
      ApiResponseHelper.success(
        spots.map(spot => publicParkingSpot(spot, userLat, userLng)),
        "Parking spots retrieved successfully",
        200
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get parking spots";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}

export async function createParkingSpotRoute(request: NextRequest) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  await connectDB();

  try {
    const body = await parseBody(request);
    const spot = await parkingSpotRepository.create(body);
    return NextResponse.json(
      ApiResponseHelper.success(publicParkingSpot(spot), "Parking spot created successfully", 201),
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
      const message = issues.map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`).join(", ");
      return NextResponse.json(ApiResponseHelper.error(message, 400), { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Failed to create parking spot";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}

export async function getParkingSpotRoute(request: NextRequest, id: string) {
  await connectDB();

  try {
    const spot = await parkingSpotRepository.findById(id);
    if (!spot) {
      return NextResponse.json(ApiResponseHelper.error("Parking spot not found", 404), { status: 404 });
    }

    return NextResponse.json(
      ApiResponseHelper.success(publicParkingSpot(spot), "Parking spot retrieved successfully", 200),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get parking spot";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}

export async function updateParkingSpotRoute(request: NextRequest, id: string) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  await connectDB();

  try {
    const body = await parseBody(request);
    const spot = await parkingSpotRepository.update(id, body);
    if (!spot) {
      return NextResponse.json(ApiResponseHelper.error("Parking spot not found", 404), { status: 404 });
    }

    return NextResponse.json(
      ApiResponseHelper.success(publicParkingSpot(spot), "Parking spot updated successfully", 200),
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
      const message = issues.map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`).join(", ");
      return NextResponse.json(ApiResponseHelper.error(message, 400), { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Failed to update parking spot";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}

export async function deleteParkingSpotRoute(request: NextRequest, id: string) {
  const adminError = await requireAdmin(request);
  if (adminError) return adminError;

  await connectDB();

  try {
    const spot = await parkingSpotRepository.delete(id);
    if (!spot) {
      return NextResponse.json(ApiResponseHelper.error("Parking spot not found", 404), { status: 404 });
    }

    return NextResponse.json(
      ApiResponseHelper.success(publicParkingSpot(spot), "Parking spot deleted successfully", 200),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete parking spot";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}
