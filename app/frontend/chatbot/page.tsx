"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bot, MessageSquare, RefreshCw, AlertCircle } from "lucide-react";
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
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Parking Assistant</h1>
              <p className="text-xs text-muted-foreground">
                Ask me to find parking, book spots, or check bookings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearChat}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Clear chat"
            title="Clear chat"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 px-10 py-20 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Hi! I&apos;m your parking assistant</h2>
                <p className="max-w-sm text-muted-foreground">
                  Ask me to find parking, book spots, or check your bookings.
                </p>
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
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border bg-card px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="flex-1">{errorMessage ?? "Something went wrong"}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="font-medium underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl">
          <ChatInput onSend={sendMessage} isLoading={status === "loading"} />
        </div>
      </div>
    </div>
  );
}
