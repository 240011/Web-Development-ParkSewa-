import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../configs/database";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";
import { getTokenFromRequest, verifyToken } from "../configs/auth";
import { generateChatReply, type ChatContext } from "../services/ai.service";
import { BookingRepository } from "../repositories/booking.repository";
import { v4 as uuid } from "uuid";

const bookingRepository = new BookingRepository();

async function getOptionalUser(request: NextRequest): Promise<ChatContext | undefined> {
  const token = getTokenFromRequest(request);
  if (!token) return undefined;

  try {
    const payload = verifyToken<{ userId?: string; full_name?: string; name?: string }>(token);
    if (!payload.userId) return undefined;

    const bookings = await bookingRepository.listByUserId(payload.userId);
    const activeBookings = bookings.filter(
      (b) => b.status === "active" || b.status === "pending"
    ).length;

    return {
      userName: payload.full_name || payload.name,
      activeBookings,
    };
  } catch {
    return undefined;
  }
}

export async function chatRoute(request: NextRequest) {
  await connectDB();

  try {
    const body = (await request.json()) as { message?: unknown };
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        ApiResponseHelper.error("Message is required", 400),
        { status: 400 }
      );
    }

    const context = await getOptionalUser(request);
    const ai = await generateChatReply(message, context);

    return NextResponse.json(
      ApiResponseHelper.success(
        {
          id: uuid(),
          reply: ai.reply,
          message: ai.reply,
          timestamp: new Date().toISOString(),
          actionType: ai.actionType,
          actionData: ai.actionData ?? null,
        },
        "Message sent successfully",
        200
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process message";
    return NextResponse.json(
      ApiResponseHelper.error(message, 500),
      { status: 500 }
    );
  }
}
