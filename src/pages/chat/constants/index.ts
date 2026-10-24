export const CHAT_EVENTS = {
    // Client → Server
    SEND_MESSAGE: "send_message",
    MARK_SEEN: "mark_seen",
    TYPING_START: "typing_start",
    TOGGLE_REACTION: "toggle_reaction",

    // Server → Client
    RECEIVE_MESSAGE: "receive_message",
    MESSAGES_SEEN: "messages_seen",
    REACTION_UPDATED: "reaction_updated",
    TYPING: "typing",
    TYPING_STOP: "typing_stop",
    CONVERSATION_STATUS_UPDATED: "conversation_status_updated",
    NEW_REQUEST: "new_request",
    USER_STATUS: "user_status",
    ONLINE_USERS: "online_users",
} as const

export const GROUP_EVENTS = {
    // Client → Server
    SEND_MESSAGE: "group_send_message",
    MARK_SEEN: "group_mark_seen",
    TOGGLE_REACTION: "group_toggle_reaction",
    TYPING_START: "group_typing_start",
    TYPING_STOP: "group_typing_stop",

    // Server → Client
    RECEIVE_MESSAGE: "group_receive_message",
    REACTION_UPDATED: "group_reaction_updated",
    TYPING: "group_typing",
    SEEN_UPDATE: "group_seen_update",
    MEMBER_JOINED: "group_member_joined",
    MEMBER_LEFT: "group_member_left",
    JOIN_REQUEST: "group_join_request",
    NOTIFICATION: "group_notification",
    ERROR: "group_error",
} as const

export type ChatEvent = typeof CHAT_EVENTS[keyof typeof CHAT_EVENTS]
export type GroupEvent = typeof GROUP_EVENTS[keyof typeof GROUP_EVENTS]