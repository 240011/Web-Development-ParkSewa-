"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { Loader2, CreditCard, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type PaymentMethod = "card" | "esewa" | "khalti";

function PaymentForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/bookings/${bookingId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load booking");
      const json = (await res.json()) as { data?: { totalAmount: number; spot?: { name: string }; promoCode?: string } };
      return json.data;
    },
    enabled: !!bookingId,
  });

  const amount = booking?.totalAmount ?? 0;

  async function handlePayment() {
    setProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push(`/frontend/bookings/confirmation?bookingId=${bookingId}`);
    } finally {
      setProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Booking Not Found</CardTitle>
            <CardDescription>The booking could not be found or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/frontend/spots">
              <Button className="w-full">Find Another Spot</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-6">
        <Link href="/frontend/spots">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment
            </CardTitle>
            <CardDescription>Complete your parking booking payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Amount to pay</p>
              <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
              {booking?.promoCode && (
                <p className="text-xs text-green-600 mt-1">Promo {booking.promoCode} applied</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(["card", "esewa", "khalti"] as PaymentMethod[]).map((method) => (
                  <Button
                    key={method}
                    variant={paymentMethod === method ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaymentMethod(method)}
                    className="capitalize"
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>

            {paymentMethod === "card" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Card Number</label>
                  <Input
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Expiry</label>
                    <Input
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">CVC</label>
                    <Input
                      placeholder="123"
                      value={cardCVC}
                      onChange={(e) => setCardCVC(e.target.value)}
                      maxLength={4}
                    />
                  </div>
                </div>
              </>
            )}

            <Button
              className="w-full"
              disabled={processing}
              onClick={handlePayment}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${formatCurrency(amount)}`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PaymentLoader() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  if (!bookingId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Booking Not Found</CardTitle>
            <CardDescription>No booking ID was provided.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/frontend/spots">
              <Button className="w-full">Find Another Spot</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <PaymentForm bookingId={bookingId} />;
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <PaymentLoader />
    </Suspense>
  );
}
