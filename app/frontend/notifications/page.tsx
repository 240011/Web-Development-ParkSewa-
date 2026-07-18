"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Bell, Check, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ENDPOINTS } from "@/lib/endpoints";
import { useState } from "react";
import Sidebar from "@/components/app-sidebar";

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
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: notifications = [], isLoading, error } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch(ENDPOINTS.notifications.list, { credentials: "include" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message ?? `Failed to load notifications (${res.status})`);
      }
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

  async function handleMarkAsRead(id: string) {
    setMarkingReadId(id);
    await fetch(ENDPOINTS.notifications.markRead, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ notificationId: id }),
    });
    queryClient.setQueryData<Notification[]>(["notifications"], (prev) =>
      (prev ?? []).map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setMarkingReadId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(ENDPOINTS.notifications.detail(id), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setDeletingId(null);
        return;
      }
      queryClient.setQueryData<Notification[]>(["notifications"], (prev) =>
        (prev ?? []).filter((n) => n.id !== id)
      );
    } catch {
      // noop
    } finally {
      setDeletingId(null);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
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
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground mr-2">
                  {unreadCount} unread
                </span>
              )}
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <Check className="h-4 w-4 mr-2" /> Mark All Read
                </Button>
              )}
            </div>
          )}
        </div>

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="py-6 flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">
                {error instanceof Error ? error.message : "Failed to load notifications"}
              </p>
            </CardContent>
          </Card>
        )}

        {!notifications.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No notifications yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={
                  notification.isRead
                    ? "opacity-60"
                    : "border-primary/30 shadow-sm"
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {!notification.isRead && (
                          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                        )}
                        {notification.title}
                      </CardTitle>
                      <span className="text-xs px-2 py-1 bg-muted rounded-full inline-block">
                        {TYPE_LABELS[notification.type]}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={markingReadId === notification.id}
                          onClick={() => handleMarkAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={deletingId === notification.id}
                        onClick={() => handleDelete(notification.id)}
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
