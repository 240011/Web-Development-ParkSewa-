import { NotificationRepository } from "../repositories/notification.repository";
import { UserRepository } from "../repositories/user.repository";

export class NotificationService {
  private notificationRepository: NotificationRepository;
  private userRepository: UserRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.userRepository = new UserRepository();
  }

  async createBookingNotification(
    userId: string,
    bookingId: string,
    spotName: string,
    vehicleNumber: string,
    startTime: Date
  ) {
    const title = "Booking Confirmed";
    const message = `Your booking for ${spotName} (${vehicleNumber}) starting ${startTime.toLocaleString()} has been confirmed.`;
    return this.notificationRepository.create({
      userId,
      title,
      message,
      type: "booking",
      relatedId: bookingId,
    });
  }

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: "booking" | "payment" | "system" | "promo";
    relatedId?: string;
  }) {
    return this.notificationRepository.create(data);
  }

  async broadcast(data: {
    title: string;
    message: string;
    type: "booking" | "payment" | "system" | "promo";
    relatedId?: string;
  }) {
    const users = await this.userRepository.listAll();
    const userIds = users.map((u) => String(u._id));
    return this.notificationRepository.createForUsers(userIds, data);
  }

  async sendToUsers(userIds: string[], data: {
    title: string;
    message: string;
    type: "booking" | "payment" | "system" | "promo";
    relatedId?: string;
  }) {
    return this.notificationRepository.createForUsers(userIds, data);
  }
}
