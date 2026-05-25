"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";

export default function FrontendLayout({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </QueryClientProvider>
  );
}