"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Calendar,
  History,
  Bell,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/frontend/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/frontend/spots", label: "Find Spots", icon: Search },
  { href: "/frontend/bookings", label: "My Bookings", icon: Calendar },
  { href: "/frontend/history", label: "History", icon: History },
  { href: "/frontend/notifications", label: "Notifications", icon: Bell },
];

const bottomItems = [
  { href: "/frontend/profile", label: "Profile", icon: User },
  { href: "/frontend/logout", label: "Logout", icon: LogOut },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Only show sidebar on the dashboard page
  const normalizedPathname = pathname.endsWith("/") 
    ? pathname.slice(0, -1) 
    : pathname;

  if (normalizedPathname !== "/frontend/dashboard" && normalizedPathname !== "/frontend/spots") {
    return null;
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">ParkSewa</h1>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
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

        <div className="border-t p-4">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
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
        </div>
      </div>
    </aside>
  );
}