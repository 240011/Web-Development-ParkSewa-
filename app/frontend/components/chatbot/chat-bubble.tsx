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
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
        ))}

      <div
        className={cn(
          "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-card text-card-foreground border"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
