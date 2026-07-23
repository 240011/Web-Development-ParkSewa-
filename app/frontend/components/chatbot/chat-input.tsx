"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSend, isLoading = false }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const text = value.trim();
    if (!text || isLoading) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm transition-shadow focus-within:border-teal-300 focus-within:shadow-md">
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask me anything..."
          disabled={isLoading}
          className="flex-1 rounded-xl border-0 bg-transparent px-3 py-2 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={isLoading || !value.trim()}
          className="shrink-0 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md hover:from-teal-700 hover:to-blue-700"
          aria-label="Send message"
        >
          {isLoading ? (
            <Sparkles className="h-4 w-4 animate-pulse" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
