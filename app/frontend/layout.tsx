"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { usePathname } from "next/navigation";

const NO_SIDEBAR_PATHS = ["/frontend/login", "/frontend/register", "/frontend/admin/login"];

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();
  const hasSidebar = !NO_SIDEBAR_PATHS.includes(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <main className={hasSidebar ? "md:pl-64 px-4" : "px-4"}>
          <div className="container mx-auto py-8">
            {children}
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}