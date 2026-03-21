export const CHAT_EVENTS = {
    // Client → Server
    SEND_MESSAGE: "send_message",
    MARK_SEEN: "mark_seen",
    TYPING_START: "typing_start",

    // Server → Client
    RECEIVE_MESSAGE: "receive_message",
    MESSAGES_SEEN: "messages_seen",
    TYPING: "typing",
    TYPING_STOP: "typing_stop",
} as const

export type ChatEvent = typeof CHAT_EVENTS[keyof typeof CHAT_EVENTS]