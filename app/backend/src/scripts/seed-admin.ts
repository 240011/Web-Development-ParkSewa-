import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import { ParkingSpot } from "../models/parking-spot.model";

const userModel = User as unknown as {
  findOne: (q: Record<string, unknown>) => { exec: () => Promise<{ _id: { toString: () => string }; full_name: string; email: string; phone: string; role: string; createdAt: Date } | null> };
  create: (d: Record<string, unknown>) => Promise<{ _id: { toString: () => string }; full_name: string; email: string; phone: string; role: string; createdAt: Date }>;
};

const parkingSpotModel = ParkingSpot as unknown as {
  find: () => { exec: () => Promise<Array<{ _id: mongoose.Types.ObjectId; name: string; location: string; latitude?: number; longitude?: number }>> };
  findByIdAndUpdate: (id: mongoose.Types.ObjectId, update: Record<string, unknown>, opts?: { returnDocument?: string; new?: boolean }) => { exec: () => Promise<null> };
};

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/parksewa";

const LOCATION_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  "kathmandu": { latitude: 27.7172, longitude: 85.3240 },
  "thamel": { latitude: 27.7172, longitude: 85.3106 },
  "durbar marg": { latitude: 27.7076, longitude: 85.3166 },
  "new road": { latitude: 27.7048, longitude: 85.3147 },
  "birtamode": { latitude: 26.6833, longitude: 87.9167 },
  "jhapa": { latitude: 26.6833, longitude: 87.9167 },
};

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const adminEmail = "admin@parksewa.com";
    const adminPassword = "admin@123";

    const existingAdmin = await userModel.findOne({ email: adminEmail }).exec();
    if (existingAdmin) {
      console.log("Admin user already exists in database");
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const adminUser = await userModel.create({
        full_name: "Admin User",
        email: adminEmail,
        phone: "0000000000",
        password: hashedPassword,
        vehicle_number: "ADMIN",
        vehicle_type: "Car",
        profileImageUrl: null,
        role: "admin",
      });

      console.log("Admin user created in database:", adminUser.email);
    }

    const spots = await parkingSpotModel.find().exec();
    console.log(`Found ${spots.length} parking spots`);

    for (const spot of spots) {
      if (!spot.latitude || !spot.longitude) {
        const locationKey = spot.name.toLowerCase().includes("kathmandu") || spot.location.toLowerCase().includes("kathmandu")
          ? "kathmandu"
          : spot.name.toLowerCase().includes("thamel") || spot.location.toLowerCase().includes("thamel")
          ? "thamel"
          : spot.name.toLowerCase().includes("birtamode") || spot.location.toLowerCase().includes("jhapa") || spot.location.toLowerCase().includes("birtamode")
          ? "jhapa"
          : null;

        if (locationKey) {
          const coords = LOCATION_COORDINATES[locationKey];
          await parkingSpotModel.findByIdAndUpdate(spot._id, coords).exec();
          console.log(`Updated coordinates for "${spot.name}": ${coords.latitude}, ${coords.longitude}`);
        }
      }
    }

    console.log("Seed completed successfully");
  } catch (error) {
    console.error("Error seeding:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

seedAdmin();