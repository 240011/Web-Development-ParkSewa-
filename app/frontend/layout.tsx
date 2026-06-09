"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { usePathname } from "next/navigation";

const NO_SIDEBAR_PATHS = ["/frontend/login", "/frontend/register"];

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();
  const hasSidebar = !NO_SIDEBAR_PATHS.includes(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <main className={hasSidebar ? "pl-64" : ""}>
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}