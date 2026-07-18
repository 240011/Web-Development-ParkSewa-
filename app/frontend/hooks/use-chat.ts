"use client";

import { useCallback, useState } from "react";
import { ENDPOINTS } from "@/lib/endpoints";
import type { ChatMessage } from "@/components/chatbot/chat-bubble";

type ChatStatus = "idle" | "loading" | "loaded" | "error";

interface UseChatResult {
  messages: ChatMessage[];
  status: ChatStatus;
  errorMessage: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  clearError: () => void;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearError = useCallback(() => setErrorMessage(null), []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const userMessage: ChatMessage = {
      id: createId(),
      content: text,
      isUser: true,
      timestamp: new Date().toISOString(),
      actionType: null,
      actionData: null,
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch(ENDPOINTS.chat.send, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: text }),
      });

      const json = (await res.json()) as {
        data?: {
          id?: string;
          reply?: string;
          message?: string;
          timestamp?: string;
          actionType?: string | null;
          actionData?: Record<string, unknown> | null;
        };
        message?: string;
        success?: boolean;
      };

      if (!res.ok || !json.data) {
        throw new Error(json.message || "Failed to get a response");
      }

      const botMessage: ChatMessage = {
        id: json.data.id ?? createId(),
        content: json.data.reply ?? json.data.message ?? "",
        isUser: false,
        timestamp: json.data.timestamp ?? new Date().toISOString(),
        actionType: json.data.actionType ?? null,
        actionData: json.data.actionData ?? null,
      };

      setMessages((prev) => [...prev, botMessage]);
      setStatus("loaded");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      setStatus("error");
      setErrorMessage(message);
    }
  }, []);

  return { messages, status, errorMessage, sendMessage, clearChat, clearError };
}
