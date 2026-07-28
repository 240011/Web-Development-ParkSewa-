import { NextRequest } from "next/server";
import { BookingController } from "../controllers/booking.controller";

const bookingController = new BookingController();

export async function getBookingsRoute(request: NextRequest) {
  return bookingController.getBookings(request);
}

export async function adminGetBookingsRoute(request: NextRequest) {
  return bookingController.adminGetBookings(request);
}

export async function createBookingRoute(request: NextRequest) {
  return bookingController.createBooking(request);
}

export async function getBookingByIdRoute(request: NextRequest) {
  return bookingController.getBookingById(request);
}
