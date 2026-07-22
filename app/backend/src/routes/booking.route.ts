import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../configs/database";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";
import { getTokenFromRequest, verifyToken } from "../configs/auth";
import { BookingRepository } from "../repositories/booking.repository";
import { ParkingSpotRepository } from "../repositories/parking-spot.repository";
import { UserRepository } from "../repositories/user.repository";
import { ParkingSpot } from "../models/parking-spot.model";
import { NotificationService } from "../services/notification.services";
import { DEFAULT_VEHICLE_PRICES } from "../constants/constant";

const bookingRepository = new BookingRepository();
const parkingSpotRepository = new ParkingSpotRepository();
const userRepository = new UserRepository();
const notificationService = new NotificationService();

function resolveVehicleType(
  booking: { vehicleType?: string; user: string },
  spot?: { vehicleTypes?: string[] },
  userMap?: Map<string, { vehicle_type?: string }>
): string {
  if (booking.vehicleType) return booking.vehicleType;

  const dbUser = userMap?.get(String(booking.user));
  if (dbUser?.vehicle_type) return dbUser.vehicle_type;

  if (spot?.vehicleTypes && spot.vehicleTypes.length > 0) {
    return spot.vehicleTypes[0];
  }

  return "Car";
}

async function getUser(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    const payload = verifyToken<{ userId?: string; role?: string }>(token);
    if (!payload.userId) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

interface CreateBookingBody {
  spotId: string;
  vehicleNumber: string;
  vehicleType?: string;
  startTime: string;
  endTime?: string;
  totalAmount: number;
  promoCode?: string;
}

export async function getBookingsRoute(request: NextRequest) {
  await connectDB();

  const user = await getUser(request);
  if (!user) {
    return NextResponse.json(
      ApiResponseHelper.error("Unauthorized - Please login", 401),
      { status: 401 }
    );
  }

  try {
    const bookings = await bookingRepository.listByUserId(user.userId);
    const spots = await parkingSpotRepository.list();
    const dbUser = await userRepository.findById(user.userId);
    const spotMap = new Map(spots.map((s) => [String(s._id), s]));

    const formattedBookings = bookings.map((booking) => {
      const spot = spotMap.get(String(booking.spot));
      return {
        id: String(booking._id),
        spot: {
          name: spot?.name ?? "Unknown spot",
          images: spot?.images ?? [],
          pricePerHour: spot?.pricePerHour ?? DEFAULT_VEHICLE_PRICES.car,
          bikePrice: spot?.bikePrice ?? DEFAULT_VEHICLE_PRICES.bike,
          carPrice: spot?.carPrice ?? DEFAULT_VEHICLE_PRICES.car,
          truckPrice: spot?.truckPrice ?? DEFAULT_VEHICLE_PRICES.truck,
          evPrice: spot?.evPrice ?? DEFAULT_VEHICLE_PRICES.ev,
        },
        vehicleNumber: booking.vehicleNumber,
        vehicleType: resolveVehicleType({ ...booking, user: String(booking.user) }, spot, dbUser ? new Map([[String(dbUser._id), dbUser]]) : undefined),
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalAmount: booking.totalAmount,
        status: booking.status,
        promoCode: booking.promoCode,
      };
    });

    return NextResponse.json(
      ApiResponseHelper.success(formattedBookings, "Bookings retrieved successfully", 200),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch bookings";
    return NextResponse.json(
      ApiResponseHelper.error(message, 500),
      { status: 500 }
    );
  }
}

export async function adminGetBookingsRoute(request: NextRequest) {
  await connectDB();

  const user = await getUser(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      ApiResponseHelper.error("Unauthorized - Admin access required", 401),
      { status: 401 }
    );
  }

  try {
    const bookings = await bookingRepository.listAll();
    const spots = await parkingSpotRepository.list();
    const users = await userRepository.listAll();

    const spotMap = new Map(spots.map((s) => [String(s._id), s]));
    const userMap = new Map(users.map((u) => [String(u._id), u]));

  const formattedBookings = bookings.map((booking) => {
      const spot = spotMap.get(String(booking.spot));
      return {
        id: String(booking._id),
        user: { name: userMap.get(String(booking.user))?.full_name ?? "Unknown user" },
        spot: {
          name: spot?.name ?? "Unknown spot",
          images: spot?.images ?? [],
          pricePerHour: spot?.pricePerHour ?? DEFAULT_VEHICLE_PRICES.car,
          bikePrice: spot?.bikePrice ?? DEFAULT_VEHICLE_PRICES.bike,
          carPrice: spot?.carPrice ?? DEFAULT_VEHICLE_PRICES.car,
          truckPrice: spot?.truckPrice ?? DEFAULT_VEHICLE_PRICES.truck,
          evPrice: spot?.evPrice ?? DEFAULT_VEHICLE_PRICES.ev,
        },
        vehicleNumber: booking.vehicleNumber,
        vehicleType: resolveVehicleType({ ...booking, user: String(booking.user) }, spot, userMap),
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalAmount: booking.totalAmount,
        status: booking.status,
        promoCode: booking.promoCode,
      };
    });

    return NextResponse.json(
      ApiResponseHelper.success(formattedBookings, "Bookings retrieved successfully", 200),
      { status: 200 }
    );
   } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch bookings";
    return NextResponse.json(
      ApiResponseHelper.error(message, 500),
      { status: 500 }
    );
  }
}

export async function createBookingRoute(request: NextRequest) {
  await connectDB();

  const user = await getUser(request);
  if (!user) {
    return NextResponse.json(
      ApiResponseHelper.error("Unauthorized - Please login", 401),
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as CreateBookingBody;

    if (!body.spotId || !body.vehicleNumber || !body.startTime || !body.totalAmount) {
      return NextResponse.json(
        ApiResponseHelper.error("Missing required fields: spotId, vehicleNumber, startTime, totalAmount", 400),
        { status: 400 }
      );
    }

    const spot = await parkingSpotRepository.findById(body.spotId);
    if (!spot) {
      return NextResponse.json(
        ApiResponseHelper.error("Parking spot not found", 404),
        { status: 404 }
      );
    }

    if (spot.availableSlots <= 0) {
      return NextResponse.json(
        ApiResponseHelper.error("No available slots for this parking spot", 400),
        { status: 400 }
      );
    }

    const startTime = new Date(body.startTime);
    const endTime = body.endTime ? new Date(body.endTime) : undefined;

    let vehicleType = body.vehicleType;
    if (!vehicleType) {
      const dbUser = await userRepository.findById(user.userId);
      vehicleType = dbUser?.vehicle_type ?? spot.vehicleTypes?.[0] ?? "Car";
    }

    const booking = await bookingRepository.create({
      userId: user.userId,
      spotId: body.spotId,
      vehicleNumber: body.vehicleNumber,
      vehicleType,
      startTime,
      endTime,
      totalAmount: body.totalAmount,
      status: "pending",
      promoCode: body.promoCode,
    });

    const currentAvailable = spot.availableSlots ?? spot.totalSlots;
    const spotModel = ParkingSpot as unknown as {
      findByIdAndUpdate: (id: string, update: Record<string, unknown>, opts: { returnDocument?: string; new?: boolean }) => { exec: () => Promise<unknown> };
    };
    await spotModel.findByIdAndUpdate(body.spotId, {
      availableSlots: Math.max(0, currentAvailable - 1),
    }, { returnDocument: "after" }).exec();

    const formattedBooking = {
      id: String(booking._id),
      user: { name: user.userId },
      spot: {
        name: spot.name,
        images: spot.images ?? [],
        pricePerHour: spot.pricePerHour ?? DEFAULT_VEHICLE_PRICES.car,
        bikePrice: spot.bikePrice ?? DEFAULT_VEHICLE_PRICES.bike,
        carPrice: spot.carPrice ?? DEFAULT_VEHICLE_PRICES.car,
        truckPrice: spot.truckPrice ?? DEFAULT_VEHICLE_PRICES.truck,
        evPrice: spot.evPrice ?? DEFAULT_VEHICLE_PRICES.ev,
      },
      vehicleNumber: booking.vehicleNumber,
      vehicleType: booking.vehicleType,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmount: booking.totalAmount,
      status: booking.status,
      promoCode: booking.promoCode,
    };

    try {
      await notificationService.createBookingNotification(
        user.userId,
        String(booking._id),
        spot.name,
        booking.vehicleNumber,
        booking.startTime
      );
    } catch {
      // Notification creation failed, but booking was successful
    }

    return NextResponse.json(
      ApiResponseHelper.success(formattedBooking, "Booking created successfully", 201),
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create booking";
    return NextResponse.json(
      ApiResponseHelper.error(message, 500),
      { status: 500 }
    );
  }
}

export async function getBookingByIdRoute(request: NextRequest) {
  await connectDB();

  const user = await getUser(request);
  if (!user) {
    return NextResponse.json(
      ApiResponseHelper.error("Unauthorized - Please login", 401),
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const bookingId = segments[segments.length - 1];

  try {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        ApiResponseHelper.error("Booking not found", 404),
        { status: 404 }
      );
    }

    const spot = await parkingSpotRepository.findById(String(booking.spot));

    const formattedBooking = {
      id: String(booking._id),
      spot: spot ? {
        name: spot.name,
        images: spot.images ?? [],
        pricePerHour: spot.pricePerHour ?? DEFAULT_VEHICLE_PRICES.car,
        bikePrice: spot.bikePrice ?? DEFAULT_VEHICLE_PRICES.bike,
        carPrice: spot.carPrice ?? DEFAULT_VEHICLE_PRICES.car,
        truckPrice: spot.truckPrice ?? DEFAULT_VEHICLE_PRICES.truck,
        evPrice: spot.evPrice ?? DEFAULT_VEHICLE_PRICES.ev,
      } : { name: "Unknown spot", images: [] },
      vehicleNumber: booking.vehicleNumber,
      vehicleType: booking.vehicleType,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmount: booking.totalAmount,
      status: booking.status,
      promoCode: booking.promoCode,
    };

    return NextResponse.json(
      ApiResponseHelper.success(formattedBooking, "Booking retrieved successfully", 200),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch booking";
    return NextResponse.json(
      ApiResponseHelper.error(message, 500),
      { status: 500 }
    );
  }
}