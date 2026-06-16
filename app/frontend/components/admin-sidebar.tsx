"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  CarFront,
  LayoutDashboard,
  LogOut,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth-actions";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  { href: "/frontend/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/frontend/admin/spots", label: "Parking Spots", icon: MapPin },
  { href: "/frontend/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/frontend/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/frontend/admin/users", label: "Users", icon: Users },
  { href: "/frontend/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    if (!showConfirm) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showConfirm]);

  const normalizedPathname = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  if (!normalizedPathname.startsWith("/frontend/admin")) {
    return null;
  }

  const handleLogoutClick = () => {
    setShowConfirm(true);
    setCountdown(2);
    setOpen(false);
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    setShowConfirm(false);

    try {
      await logoutAction();
      router.push("/frontend/admin/login");
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-md border bg-background p-2 shadow-sm md:hidden"
        aria-label="Open admin sidebar"
      >
        <PanelLeftOpen className="h-5 w-5" />
      </button>

      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="Close admin sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col border-r bg-card shadow-xl transition-transform duration-200 md:translate-x-0",
          open && "translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/frontend/admin/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <CarFront className="h-6 w-6 text-primary" />
            <div>
              <span className="block text-xl font-bold text-primary">ParkSewa</span>
              <span className="text-xs text-muted-foreground">Admin Console</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="md:hidden"
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (pathname.startsWith(item.href) && item.href !== "/frontend/admin/dashboard");

              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary",
                      isActive && "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="border-t p-4">
          <div className="mb-3 rounded-lg border bg-background p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.name || "Admin User"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email || "admin"}</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            disabled={loggingOut}
            onClick={handleLogoutClick}
            className="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            {loggingOut ? "Logging out…" : "Log out"}
          </Button>
        </div>
      </aside>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Confirm Logout</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Are you sure you want to logout?{countdown > 0 && (
                <span className="ml-2 font-medium text-destructive">
                  Logging out in {countdown}s
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={loggingOut || countdown === 0}
              >
                No
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out…" : countdown === 0 ? "Logout Now" : `Yes (${countdown})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
