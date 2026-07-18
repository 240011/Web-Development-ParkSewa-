"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ENDPOINTS } from "@/lib/endpoints";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "booking" | "payment" | "system" | "promo";
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
};

const TYPE_LABELS: Record<Notification["type"], string> = {
  booking: "Booking",
  payment: "Payment",
  system: "System",
  promo: "Promo",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch(ENDPOINTS.notifications.list, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load notifications");
      const json = (await res.json()) as { data?: Notification[] };
      return json.data ?? [];
    },
  });

  async function handleMarkAllAsRead() {
    await fetch(ENDPOINTS.notifications.markRead, {
      method: "POST",
      credentials: "include",
    });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/frontend/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 -ml-4">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">View your notifications and alerts.</p>
          </div>
        </div>
        {notifications && notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <Check className="h-4 w-4 mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      {!notifications?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.isRead ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{notification.title}</CardTitle>
                  <span className="text-xs px-2 py-1 bg-muted rounded-full">
                    {TYPE_LABELS[notification.type]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}