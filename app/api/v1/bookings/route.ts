import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Mock bookings data matching the frontend interface
  const mockBookings = [
    { 
      id: 1, 
      spot: { name: "Downtown Parking" }, 
      vehicleNumber: "BA 1 PA 1234", 
      startTime: "2024-01-15T10:00:00Z", 
      totalAmount: 500, 
      status: "active" 
    },
    { 
      id: 2, 
      spot: { name: "Mall Parking" }, 
      vehicleNumber: "BA 1 PA 1234", 
      startTime: "2024-01-14T10:00:00Z", 
      totalAmount: 300, 
      status: "completed" 
    },
    { 
      id: 3, 
      spot: { name: "Airport Parking" }, 
      vehicleNumber: "BA 2 AB 5678", 
      startTime: "2024-01-13T09:00:00Z", 
      totalAmount: 1200, 
      status: "completed" 
    }
  ];

  return new Response(JSON.stringify(mockBookings), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}