import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  actionType?: string | null;
  actionData?: Record<string, unknown> | null;
}

interface ChatBubbleProps {
  message: ChatMessage;
  showAvatar: boolean;
}

export function ChatBubble({ message, showAvatar }: ChatBubbleProps) {
  const isUser = message.isUser;

  return (
    <div
      className={cn(
        "flex items-start gap-2",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {showAvatar &&
        (isUser ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 shadow-sm">
            <User className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-md">
            <Bot className="h-4 w-4" />
          </div>
        ))}

      <div
        className={cn(
          "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-sm bg-gradient-to-br from-teal-600 to-blue-600 text-white shadow-md"
            : "rounded-bl-sm bg-white text-gray-800 border border-gray-100"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
