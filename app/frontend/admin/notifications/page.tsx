"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Send, Loader2, Trash2, ChevronDown } from "lucide-react";
import AdminSidebar from "@/components/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ENDPOINTS } from "@/lib/endpoints";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "booking" | "payment" | "system" | "promo";
  isRead: boolean;
  relatedId?: string;
  userId: string;
  userName: string;
  createdAt: string;
};

type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  role: "user" | "admin";
};

const TYPE_LABELS: Record<Notification["type"], string> = {
  booking: "Booking",
  payment: "Payment",
  system: "System",
  promo: "Promo",
};

const TYPE_COLORS: Record<Notification["type"], string> = {
  booking: "bg-blue-100 text-blue-700",
  payment: "bg-green-100 text-green-700",
  system: "bg-gray-100 text-gray-700",
  promo: "bg-orange-100 text-orange-700",
};

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<Notification["type"]>("system");
  const [target, setTarget] = useState<"all" | "specific">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; desc: string; type: string } | null>(null);
  const [userSearch, setUserSearch] = useState("");

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["admin-notifications"],
    queryFn: async (): Promise<Notification[]> => {
      const res = await fetch(ENDPOINTS.adminNotifications.list, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load notifications");
      const json = await res.json() as { data?: Notification[] };
      return json.data ?? [];
    },
  });

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["admin-users-list"],
    queryFn: async (): Promise<AdminUser[]> => {
      const res = await fetch(`${ENDPOINTS.users.adminList}?limit=1000`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load users");
      const json = await res.json() as { data?: AdminUser[] };
      return json.data ?? [];
    },
  });

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  function showToast(title: string, desc: string, type = "success") {
    setToast({ title, desc, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      showToast("Validation Error", "Title and message are required", "destructive");
      return;
    }

    setSending(true);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        message: message.trim(),
        type,
        target,
      };
      if (target === "specific") {
        body.userIds = selectedUsers;
      }

      const res = await fetch(ENDPOINTS.adminNotifications.send, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to send notification");

      showToast("Sent", json.message || `Notification sent to ${json.data?.count ?? "users"} users`);
      setTitle("");
      setMessage("");
      setType("system");
      setTarget("all");
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch (e) {
      showToast("Error", e instanceof Error ? e.message : "Failed to send", "destructive");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(ENDPOINTS.adminNotifications.detail(id), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      queryClient.setQueryData<Notification[]>(["admin-notifications"], (prev) =>
        (prev ?? []).filter((n) => n.id !== id)
      );
      showToast("Deleted", "Notification deleted");
    } catch {
      showToast("Error", "Failed to delete notification", "destructive");
    } finally {
      setDeletingId(null);
    }
  }

  function toggleUser(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Send and manage notifications for all users.</p>
        </div>

        {toast && (
          <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === "destructive" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
            <p className="font-medium text-sm">{toast.title}</p>
            <p className="text-xs opacity-90">{toast.desc}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" /> Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1.5">Title</p>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5">Type</p>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background h-10"
                  value={type}
                  onChange={(e) => setType(e.target.value as Notification["type"])}
                >
                  <option value="system">System</option>
                  <option value="booking">Booking</option>
                  <option value="payment">Payment</option>
                  <option value="promo">Promo</option>
                </select>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1.5">Message</p>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm bg-background min-h-[80px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your notification message..."
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-1.5">Send To</p>
              <div className="flex gap-2">
                <Button
                  variant={target === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setTarget("all"); setSelectedUsers([]); }}
                >
                  All Users
                </Button>
                <Button
                  variant={target === "specific" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTarget("specific")}
                >
                  Specific Users
                </Button>
              </div>
            </div>

            {target === "specific" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Select Users ({selectedUsers.length} selected)</p>
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="max-w-sm"
                />
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">No users found.</p>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = selectedUsers.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 ${u.id === currentUser?.id ? "bg-muted/30" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUser(u.id)}
                            className="rounded"
                          />
                          <span className="flex-1 text-sm">
                            <span className="font-medium">{u.full_name}</span>
                            <span className="text-muted-foreground ml-1">&lt;{u.email}&gt;</span>
                          </span>
                          <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">
                            {u.role}
                          </Badge>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <Button className="w-full gap-2" onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> All Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No notifications in the system.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start justify-between gap-4 p-4 rounded-lg border ${n.isRead ? "opacity-60 bg-muted/20" : "bg-background shadow-sm"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{n.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[n.type]}`}>
                          {TYPE_LABELS[n.type]}
                        </span>
                        {n.isRead ? (
                          <Badge variant="secondary" className="text-xs">Read</Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">Unread</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        To: <span className="font-medium">{n.userName}</span> | {formatDate(n.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                      disabled={deletingId === n.id}
                      onClick={() => handleDelete(n.id)}
                      title="Delete notification"
                    >
                      {deletingId === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
