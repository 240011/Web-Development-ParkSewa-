export type ChatActionType =
  | "find_parking"
  | "show_offers"
  | "show_bookings"
  | "show_profile"
  | null;

export interface ChatAIResponse {
  reply: string;
  actionType: ChatActionType;
  actionData?: Record<string, unknown> | null;
}

export interface ChatContext {
  userName?: string;
  activeBookings?: number;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

const SYSTEM_PROMPT = `You are "ParkSewa Assistant", a friendly and helpful AI chatbot for ParkSewa, a parking spot discovery and booking platform in Nepal.

Your job is to help users with:
- Finding and booking parking spots
- Understanding their current/past bookings
- Discovering active promos and discounts
- Managing their profile/account

Guidelines:
- Keep replies short, friendly, and conversational (1-3 sentences).
- Respond in English.
- When the user wants to perform an action, set "actionType" to the most relevant value and include any useful "actionData".
- Use these actionType values:
  - "find_parking" when the user wants to locate or book a parking spot. Put a search keyword (area, landmark, or spot name) in actionData.query when present.
  - "show_offers" when the user asks about promos, discounts, or coupon codes.
  - "show_bookings" when the user asks about their bookings or reservations.
  - "show_profile" when the user asks about their account, profile, or settings.
- If none of these apply, set actionType to "none" (or null).
- You may use the provided user context to personalize replies.`;

export async function generateChatReply(
  message: string,
  context?: ChatContext
): Promise<ChatAIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return localFallback(message);
  }

  try {
    const contextNote = buildContextNote(context);

    const response = await fetch(GEMINI_URL(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${contextNote}User message:\n${message}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 512,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              reply: { type: "STRING" },
              actionType: {
                type: "STRING",
                enum: [
                  "find_parking",
                  "show_offers",
                  "show_bookings",
                  "show_profile",
                  "none",
                ],
              },
              actionData: {
                type: "OBJECT",
                nullable: true,
                properties: {
                  query: { type: "STRING", nullable: true },
                },
              },
            },
            required: ["reply", "actionType"],
          },
        },
      }),
    });

    if (!response.ok) {
      try {
        const err = await response.json();
        console.error("Gemini API error:", response.status, err?.error?.message ?? err);
      } catch {
        console.error("Gemini API error:", response.status, response.statusText);
      }
      return localFallback(message);
    }

    const json = (await response.json()) as GeminiResponse;
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return localFallback(message);

    const parsed = JSON.parse(text) as {
      reply?: string;
      actionType?: string;
      actionData?: Record<string, unknown> | null;
    };

    const cleanedReply = (parsed.reply ?? '').trim();
    const normalizedReply =
      cleanedReply.length === 0 || cleanedReply.toLowerCase() === 'null'
        ? "I'm here to help with your parking needs!"
        : cleanedReply;

    const actionType = normalizeActionType(parsed.actionType);
    return {
      reply: normalizedReply,
      actionType,
      actionData: actionType ? parsed.actionData ?? null : null,
    };
  } catch {
    return localFallback(message);
  }
}

function buildContextNote(context?: ChatContext): string {
  if (!context) return "";
  const parts: string[] = [];
  if (context.userName) parts.push(`User's name: ${context.userName}.`);
  if (typeof context.activeBookings === "number") {
    parts.push(`User has ${context.activeBookings} active booking(s).`);
  }
  return parts.length ? `Context:\n${parts.join(" ")}\n\n` : "";
}

function normalizeActionType(value?: string): ChatActionType {
  switch (value) {
    case "find_parking":
      return "find_parking";
    case "show_offers":
      return "show_offers";
    case "show_bookings":
      return "show_bookings";
    case "show_profile":
      return "show_profile";
    default:
      return null;
  }
}

function localFallback(message: string): ChatAIResponse {
  const text = message.toLowerCase();

  if (/(offer|promo|discount|coupon|deal)/.test(text)) {
    return {
      reply: "You can check out all our active discounts and promo codes on the Promos page. Want me to take you there?",
      actionType: "show_offers",
    };
  }

  if (/(booking|reservation|reserved|my park|active park)/.test(text)) {
    return {
      reply: "Let me pull up your bookings so you can track your parking sessions.",
      actionType: "show_bookings",
    };
  }

  if (/(profile|account|setting|password|vehicle)/.test(text)) {
    return {
      reply: "Head over to your profile to update your details, vehicle info, or password.",
      actionType: "show_profile",
    };
  }

  const parkingMatch = /(find|book|park|spot|near|location|where|nearest)/.test(text);
  if (parkingMatch) {
    const query = extractQuery(text);
    return {
      reply: query
        ? `Looking for parking near "${query}". Let me show you the closest available spots.`
        : "Sure! Let me show you available parking spots near you.",
      actionType: "find_parking",
      actionData: query ? { query } : null,
    };
  }

  return {
    reply:
      "Hi! I'm your ParkSewa assistant. I can help you find parking, view your bookings, discover promos, or manage your profile. What would you like to do?",
    actionType: null,
  };
}

function extractQuery(text: string): string | null {
  const match = text.match(
    /(?:near|in|at|around|for|by)\s+([a-z0-9 .'-]+?)(?:$|\?|\.|,)/i
  );
  if (match?.[1]) {
    const cleaned = match[1].trim();
    if (cleaned.length > 1 && cleaned.length <= 40) return cleaned;
  }
  return null;
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}
