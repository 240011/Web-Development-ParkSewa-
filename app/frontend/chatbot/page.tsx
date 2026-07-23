"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bot, MessageSquare, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import Sidebar from "../components/app-sidebar";
import { ChatBubble } from "@/components/chatbot/chat-bubble";
import { ChatInput } from "@/components/chatbot/chat-input";
import { useChat } from "@/hooks/use-chat";

export default function ChatbotPage() {
  const router = useRouter();
  const { messages, status, errorMessage, sendMessage, clearChat, clearError } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const handledIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.isUser || !last.actionType) return;
    if (handledIds.current.has(last.id)) return;
    handledIds.current.add(last.id);

    switch (last.actionType) {
      case "find_parking": {
        const query = last.actionData?.query as string | undefined;
        router.push(query ? `/frontend/spots?q=${encodeURIComponent(query)}` : "/frontend/spots");
        break;
      }
      case "show_offers":
        router.push("/frontend/promos");
        break;
      case "show_bookings":
        router.push("/frontend/bookings");
        break;
      case "show_profile":
        router.push("/frontend/profile");
        break;
    }
  }, [messages, router]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-8">
        <header className="relative overflow-hidden border-b bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-5 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)]" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Parking Assistant</h1>
                <p className="text-xs text-white/80">
                  Ask me to find parking, book spots, or check bookings
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearChat}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Clear chat</span>
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-4 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-5 px-10 py-20 text-center">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500 to-blue-600 shadow-xl">
                  <div className="absolute inset-0 rounded-3xl bg-white/10" />
                  <MessageSquare className="h-12 w-12 text-white relative" />
                  <div className="absolute -right-1 -top-1 rounded-full bg-amber-400 p-1.5 shadow-md">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                    Hi! I&apos;m your parking assistant
                  </h2>
                  <p className="max-w-sm text-muted-foreground">
                    Ask me to find parking, book spots, or check your bookings.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 w-full max-w-lg">
                  {[
                    { label: "Find parking", query: "Find parking spots nearby" },
                    { label: "My bookings", query: "Show my bookings" },
                    { label: "Current offers", query: "Show available offers" },
                  ].map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => sendMessage(suggestion.query)}
                      className="rounded-lg border border-teal-100 bg-white px-4 py-3 text-sm font-semibold text-teal-700 shadow-sm transition-all hover:border-teal-300 hover:shadow-md hover:-translate-y-0.5"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  showAvatar={
                    index === 0 || messages[index - 1].isUser !== message.isUser
                  }
                />
              ))
            )}

            {status === "loading" && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-md">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border bg-white px-4 py-3 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500" />
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span className="flex-1">{errorMessage ?? "Something went wrong"}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="font-medium underline text-red-700 hover:text-red-900"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t bg-white/80 backdrop-blur-md px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <ChatInput onSend={sendMessage} isLoading={status === "loading"} />
          </div>
        </div>
      </div>
    </div>
  );
}
