"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, CarFront } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import Sidebar from "../components/app-sidebar";

interface Spot {
  id: number;
  name: string;
  address: string;
  pricePerHour: number;
  availableSlots: number;
  totalSlots: number;
  status: string;
  vehicleTypes: string[];
  images?: string[];
}

const mockSpots: Spot[] = [
  { id: 1, name: "Downtown Parking", address: "Kathmandu Mall, Kathmandu", pricePerHour: 150, availableSlots: 15, totalSlots: 30, status: "active", vehicleTypes: ["car", "bike"], images: [] },
  { id: 2, name: "Airport Parking", address: "Tribhuvan Airport, Kathmandu", pricePerHour: 200, availableSlots: 8, totalSlots: 20, status: "active", vehicleTypes: ["car"], images: [] },
  { id: 3, name: "Hospital Parking", address: "Norvic Hospital, Kathmandu", pricePerHour: 100, availableSlots: 0, totalSlots: 15, status: "active", vehicleTypes: ["car"], images: [] },
];

export default function SpotsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSpots = mockSpots.filter(spot =>
    spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    spot.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Find Parking Spots</h1>
            <p className="text-muted-foreground">Discover and book available parking near you</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by location, spot name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpots.map((spot) => (
            <Card key={spot.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-muted relative overflow-hidden flex items-center justify-center">
                {spot.images && spot.images.length > 0 ? (
                  <img src={spot.images[0]} alt={spot.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                    <CarFront className="h-16 w-16 text-primary/40 absolute" />
                  </>
                )}
                <Badge variant={spot.status === "active" ? "default" : "secondary"} className="absolute top-3 right-3 font-medium">
                  {spot.status}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-1">{spot.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-3 w-3" />
                  <span>{spot.address}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Price/hr</span>
                    <div className="font-semibold">{formatCurrency(spot.pricePerHour)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Available</span>
                    <div className="font-semibold">{spot.availableSlots}/{spot.totalSlots}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {spot.vehicleTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs capitalize">
                      {type}
                    </Badge>
                  ))}
                </div>
                <Link href={`/frontend/spots/${spot.id}`}>
                  <Button className="w-full" disabled={spot.availableSlots === 0}>
                    {spot.availableSlots === 0 ? "Full" : "Book Now"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
          {filteredSpots.length === 0 && (
            <div className="col-span-full text-center py-12">
              <CarFront className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No spots found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}