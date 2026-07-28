import { NextRequest } from "next/server";
import { ParkingSpotController } from "../controllers/parking-spot.controller";

const parkingSpotController = new ParkingSpotController();

export async function getParkingSpotsRoute(request: NextRequest) {
  return parkingSpotController.getParkingSpots(request);
}

export async function createParkingSpotRoute(request: NextRequest) {
  return parkingSpotController.createParkingSpot(request);
}

export async function getParkingSpotRoute(request: NextRequest, id: string) {
  return parkingSpotController.getParkingSpot(request, id);
}

export async function updateParkingSpotRoute(request: NextRequest, id: string) {
  return parkingSpotController.updateParkingSpot(request, id);
}

export async function deleteParkingSpotRoute(request: NextRequest, id: string) {
  return parkingSpotController.deleteParkingSpot(request, id);
}
