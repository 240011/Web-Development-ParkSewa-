"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Calendar, Percent, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { ENDPOINTS } from "@/lib/endpoints";
import Sidebar from "@/components/app-sidebar";

type Promo = {
  id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  value: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  minBookingAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function PromosPage() {
  const { data: promos, isLoading } = useQuery({
    queryKey: ["promos"],
    queryFn: async (): Promise<Promo[]> => {
      const res = await fetch(ENDPOINTS.promos.list, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load promos");
      const json = await res.json() as { data?: Promo[] };
      return (json.data ?? []).filter((p) => p.isActive);
    },
  });

  const activePromos = useMemo(() => {
    const now = new Date();
    return (promos ?? []).filter((p) => new Date(p.expiryDate) > now);
  }, [promos]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
          <h1 className="text-3xl font-bold tracking-tight">Promo Codes</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promo Codes</h1>
          <p className="text-muted-foreground">Apply these codes during booking to get discounts.</p>
        </div>
        {activePromos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No active promo codes available right now.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePromos.map((promo) => {
              const discountDisplay = promo.discountType === "percentage"
                ? `${promo.value}% off`
                : `${formatCurrency(promo.value)} off`;

              return (
                <Card key={promo.id} className="hover-elevate transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-mono">{promo.code}</CardTitle>
                      <Badge variant="default">Active</Badge>
                    </div>
                    {promo.description && <p className="text-sm text-muted-foreground mt-1">{promo.description}</p>}
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {promo.discountType === "percentage"
                        ? <Percent className="h-3.5 w-3.5 text-primary" />
                        : <Tag className="h-3.5 w-3.5 text-primary" />
                      }
                      <span className="font-medium">{discountDisplay}</span>
                    </div>
                    {promo.minBookingAmount > 0 && (
                      <p className="text-xs text-muted-foreground">Min. booking amount: {formatCurrency(promo.minBookingAmount)}</p>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" /> Valid till {new Date(promo.expiryDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5" /> Uses left: {promo.usageLimit - promo.usageCount}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
