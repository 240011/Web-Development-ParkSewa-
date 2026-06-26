"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Calendar,
  Bell,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth-actions";

const menuItems = [
  { href: "/frontend/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/frontend/spots", label: "Find Spots", icon: Search },
  { href: "/frontend/bookings", label: "My Bookings", icon: Calendar },
  { href: "/frontend/notifications", label: "Notifications", icon: Bell },
];

const bottomItems = [
  { href: "/frontend/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [countdown, setCountdown] = useState(2);
  const [open, setOpen] = useState(false);

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

  const handleLogoutClick = () => {
    setShowConfirm(true);
    setCountdown(2);
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    setShowConfirm(false);
    try {
      await logoutAction();
      router.push("/frontend/login");
    } catch {
      setLoggingOut(false);
    }
  };

  const normalizedPathname = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  if (
    normalizedPathname !== "/frontend/dashboard" &&
    normalizedPathname !== "/frontend/spots" &&
    normalizedPathname !== "/frontend/bookings" &&
    normalizedPathname !== "/frontend/profile"
  ) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-md border bg-background p-2 shadow-sm md:hidden"
        aria-label="Open sidebar"
      >
        <PanelLeftOpen className="h-5 w-5" />
      </button>

      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col border-r bg-card shadow-xl transition-transform duration-200 md:translate-x-0",
          open && "translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-bold">ParkSewa</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="md:hidden"
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4 space-y-1">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          <Button
            variant="ghost"
            disabled={loggingOut}
            onClick={handleLogoutClick}
            className="w-full justify-start gap-3"
          >
            <LogOut className="h-5 w-5" />
            {loggingOut ? "Logging out…" : "Logout"}
          </Button>
        </div>
      </aside>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to logout?{countdown > 0 && (
                <span className="ml-2 text-red-500 font-medium">Logging out in {countdown}s</span>
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