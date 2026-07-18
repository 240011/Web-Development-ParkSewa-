"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MapPin, CarFront, Loader2, Calendar, Tag, AlertCircle, ArrowLeft, CheckCircle, LocateFixed } from "lucide-react";
import { formatCurrency, vehicleTypeLabel } from "@/lib/format";
import { DEFAULT_VEHICLE_PRICES } from "@/lib/constants";

interface ParkingSpot {
  id: string;
  name: string;
  address: string;
  location: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  pricePerHour: number;
  bikePrice?: number;
  carPrice?: number;
  truckPrice?: number;
  evPrice?: number;
  availableSlots: number;
  totalSlots: number;
  status: string;
  vehicleTypes: string[];
  images?: string[];
}

const fetchParkingSpot = async (id: string): Promise<ParkingSpot> => {
  const res = await fetch(`/api/v1/parking-spots/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load parking spot");
  const json = await res.json() as { data?: ParkingSpot };
  if (!json.data) throw new Error("Parking spot not found");
  return json.data;
};

const getInitialStartTime = () => {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  return oneHourLater.toISOString().slice(0, 16);
};

export default function SpotDetailPage() {
  const { id: spotId } = useParams<{ id: string }>();
  const router = useRouter();

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [startTime, setStartTime] = useState(getInitialStartTime);
  const [endTime, setEndTime] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userVehicleType, setUserVehicleType] = useState<string>("");
  const [overrideVehicleType, setOverrideVehicleType] = useState<string>("");

  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<{ valid: boolean; discount?: number; finalAmount?: number; error?: string } | null>(null);
  const [validated, setValidated] = useState(false);

  const [loading, setLoading] = useState(false);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [toast, setToast] = useState<{ title: string; desc: string; type: string } | null>(null);

  const { data: spot, isLoading } = useQuery<ParkingSpot>({
    queryKey: ["parking-spot", spotId],
    queryFn: () => fetchParkingSpot(spotId),
    enabled: !!spotId,
  });

  useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const res = await fetch("/api/v1/auth/current-user", { credentials: "include" });
      if (!res.ok) return null;
      const json = await res.json() as { data?: { vehicle_type?: string } };
      return json.data?.vehicle_type ?? null;
    },
    onSuccess: (vehicleType) => {
      if (vehicleType) {
        setUserVehicleType(vehicleType.toLowerCase());
      }
    },
  });

  const normalizedTypes = useMemo(() => (spot?.vehicleTypes || []).map((t) => t.toLowerCase()), [spot?.vehicleTypes]);

  const effectiveVehicleType = overrideVehicleType ||
    (userVehicleType && normalizedTypes.includes(userVehicleType) ? userVehicleType : normalizedTypes[0]) ||
    "";

  const distance = useMemo(() => {
    if (!spot?.latitude || !spot?.longitude || !userLocation) return undefined;
    const R = 6371;
    const dLat = ((spot.latitude - userLocation.lat) * Math.PI) / 180;
    const dLng = ((spot.longitude - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((spot.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round((R * c) * 10) / 10;
  }, [spot, userLocation]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (title: string, desc: string, type = "default") => {
    setToast({ title, desc, type });
  };

  const getVehiclePrice = () => {
    if (!spot) return spot?.pricePerHour ?? DEFAULT_VEHICLE_PRICES.car;
    const type = effectiveVehicleType || "car";
    if (type === "bike") return spot.bikePrice ?? DEFAULT_VEHICLE_PRICES.bike;
    if (type === "truck") return spot.truckPrice ?? DEFAULT_VEHICLE_PRICES.truck;
    if (type === "car") return spot.carPrice ?? DEFAULT_VEHICLE_PRICES.car;
    if (type === "ev") return spot.evPrice ?? DEFAULT_VEHICLE_PRICES.ev;
    return spot.pricePerHour ?? DEFAULT_VEHICLE_PRICES.car;
  };

  const estimatedAmount = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (end <= start) return 0;
    const hours = Math.max(0.25, Math.ceil((end - start) / (1000 * 60 * 60)));
    return Math.round(parseFloat((hours * getVehiclePrice()).toFixed(2)));
  }, [startTime, endTime, spot, effectiveVehicleType]);

  const finalPayableAmount = useMemo(() => {
    if (!promoResult?.valid) return estimatedAmount;
    return promoResult.finalAmount ?? estimatedAmount - (promoResult.discount ?? 0);
  }, [estimatedAmount, promoResult]);

  async function handleValidatePromo(e: FormEvent) {
    e.preventDefault();
    if (!promoCode.trim()) {
      showToast("Error", "Enter a promo code.", "destructive");
      return;
    }
    setValidatingPromo(true);
    try {
      const res = await fetch("/api/v1/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), bookingAmount: estimatedAmount }),
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message ?? "Invalid promo code");
      }

      const data = json.data;
      setPromoResult({
        valid: true,
        discount: data.discountAmount,
        finalAmount: estimatedAmount - data.discountAmount,
      });
      setValidated(true);
      showToast("Promo Applied!", `Discount of ${formatCurrency(data.discountAmount)} applied.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Validation failed";
      setPromoResult({ valid: false, error: message });
      showToast("Invalid Promo", message, "destructive");
    } finally {
      setValidatingPromo(false);
    }
  }

  function handleBook() {
    if (!vehicleNumber.trim()) {
      showToast("Error", "Enter your vehicle number.", "destructive");
      return;
    }
    if (!startTime || !endTime) {
      showToast("Error", "Select start and end time.", "destructive");
      return;
    }
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (end <= start) {
      showToast("Error", "End time must be after start time.", "destructive");
      return;
    }
    
    const MAX_BOOKING_HOURS = 24;
    const hours = (end - start) / (1000 * 60 * 60);
    if (hours > MAX_BOOKING_HOURS) {
      showToast("Error", `Maximum booking duration is ${MAX_BOOKING_HOURS} hours.`, "destructive");
      return;
    }
    if (!spot) return;

    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/v1/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            spotId: spot.id,
            vehicleNumber,
            vehicleType: effectiveVehicleType ? effectiveVehicleType.charAt(0).toUpperCase() + effectiveVehicleType.slice(1) : undefined,
            startTime,
            endTime,
            totalAmount: finalPayableAmount,
            promoCode: promoResult?.valid ? promoCode.trim().toUpperCase() : undefined,
          }),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.message ?? "Failed to create booking");
        }

        const json = (await res.json()) as { data?: { id: string } };
        const bookingId = json.data?.id;

        if (bookingId) {
          showToast("Booking Created!", "Proceed to payment.");
          router.push(`/frontend/payment?bookingId=${bookingId}`);
        } else {
          throw new Error("No booking ID returned");
        }
      } catch (error) {
        showToast("Error", error instanceof Error ? error.message : "Failed to create booking", "destructive");
      } finally {
        setLoading(false);
      }
    })();
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/frontend/spots">
            <Button variant="ghost" size="sm" className="gap-2 -ml-4">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Loading parking spot…</h1>
        </div>
        <Card><CardContent className="p-6"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/frontend/spots"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-3xl font-bold">Spot Not Found</h1>
        </div>
        <Card><CardContent className="p-6"><p className="text-muted-foreground">The parking spot you are looking for does not exist or has been removed.</p></CardContent></Card>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "destructive" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
          <p className="font-medium text-sm">{toast.title}</p>
          <p className="text-xs opacity-90">{toast.desc}</p>
        </div>
      )}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/frontend/spots">
            <Button variant="ghost" size="sm" className="gap-2 -ml-4">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{spot.name}</h1>
            <p className="text-muted-foreground">Book your parking spot</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden">
              <div className="h-56 bg-muted relative overflow-hidden flex items-center justify-center">
                {spot.images && spot.images.length > 0 ? (
                  <img 
                    src={spot.images[0]} 
                    alt={spot.name} 
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/default-spot-image.png';
                    }}
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                    <CarFront className="h-20 w-20 text-primary/40 absolute" />
                  </>
                )}
                <Badge variant={spot.status === "active" ? "default" : "secondary"} className="absolute top-4 right-4 font-medium">
                  {spot.status}
                </Badge>
              </div>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-2">{spot.name}</h2>
<div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{spot.address}</span>
                  {distance !== undefined && (
                    <span className="ml-auto text-xs text-primary font-medium">
                      {distance} km away
                    </span>
                  )}
                </div>
                {(!userLocation && spot.latitude && spot.longitude) && (
                  <button
                    onClick={() => {
                      navigator.geolocation?.getCurrentPosition((pos) => {
                        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                      });
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:underline mb-3"
                  >
                    <LocateFixed className="h-3 w-3" /> Show distance from my location
                  </button>
                )}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-muted/50 p-3 rounded-md text-center">
                    <div className="text-xs text-muted-foreground mb-1">Available</div>
                    <div className="font-semibold text-primary">{spot.availableSlots} / {spot.totalSlots}</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md text-center">
                    <div className="text-xs text-muted-foreground mb-1">Price / hr</div>
                    <div className="font-semibold">{formatCurrency(getVehiclePrice())}</div>
                    {userVehicleType && (
                      <div className="text-[10px] text-muted-foreground capitalize mt-0.5">{userVehicleType} rate</div>
                    )}
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md text-center">
                    <div className="text-xs text-muted-foreground mb-1">Type</div>
                    <div className="font-semibold capitalize">{(spot.vehicleTypes || []).join(", ") || "N/A"}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  {(spot.vehicleTypes || []).map((type) => (
                    <Badge key={type} variant="outline" className="text-xs bg-background">{vehicleTypeLabel(type)}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Book Your Spot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Vehicle Number</label>
                  <Input
                    placeholder="BA 1 PA 1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </div>

                {normalizedTypes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Vehicle Type</label>
                    <div className="flex flex-wrap gap-2">
                      {normalizedTypes.map((type, idx) => {
                        const originalType = spot!.vehicleTypes![idx];
                        const isSelected = effectiveVehicleType === type;
                        const price = type === "bike" ? spot!.bikePrice ?? DEFAULT_VEHICLE_PRICES.bike : type === "truck" ? spot!.truckPrice ?? DEFAULT_VEHICLE_PRICES.truck : type === "car" ? spot!.carPrice ?? DEFAULT_VEHICLE_PRICES.car : type === "ev" ? spot!.evPrice ?? DEFAULT_VEHICLE_PRICES.ev : spot!.pricePerHour ?? DEFAULT_VEHICLE_PRICES.car;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setOverrideVehicleType(type)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-accent border-input"
                            }`}
                          >
                             {vehicleTypeLabel(originalType)}
                            {price !== undefined && <span className="opacity-75">{formatCurrency(price)}/hr</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => { 
                      const newStartTime = e.target.value;
                      setStartTime(newStartTime);
                      setPromoResult(null);
                      setValidated(false);
                      if (endTime && newStartTime >= endTime) {
                        setEndTime('');
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">End Time</label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => { setEndTime(e.target.value); setPromoResult(null); setValidated(false); }}
                    min={startTime}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Promo Code <span className="text-muted-foreground">(optional)</span></label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); setValidated(false); }}
                      disabled={validatingPromo}
                    />
                    <Button
                      variant="outline"
                      onClick={handleValidatePromo}
                      disabled={validatingPromo || !promoCode.trim()}
                      className="shrink-0"
                    >
                      {validatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                  {validated && promoResult && (
                    <div className={`flex items-center gap-2 mt-2 text-sm ${promoResult.valid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {promoResult.valid ? <><CheckCircle className="h-4 w-4" /> Promo applied: save {formatCurrency(promoResult.discount ?? 0)}</> : <><AlertCircle className="h-4 w-4" /> {promoResult.error ?? "Invalid promo code"}</>}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Estimated Amount</span>
                    <span>{formatCurrency(estimatedAmount)}</span>
                  </div>
                  {promoResult?.valid && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> Discount</span>
                      <span>-{formatCurrency(promoResult.discount ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Payable Amount</span>
                    <span>{formatCurrency(finalPayableAmount)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={loading || spot.availableSlots === 0 || spot.status !== "active"}
                  onClick={handleBook}
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...</> : spot.availableSlots === 0 ? "Full" : "Book Now"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}