export interface IUser {
    id: number
    name: string
    avatar?: string
    is_online?: boolean
    email?: string
}

export interface IGroupSettings {
    id: number
    group_id: number        // ← string → number
    who_can_send: string
    who_can_edit_info: string
    who_can_add_members: string
    who_can_remove_members: string
    who_can_share_link: string
    who_can_change_settings: string
}

export interface IGroupCreator {
    id: number
    name: string
    avatar?: string | null
}

export interface IGroupMember {
    id: number
    role: "admin" | "member"
    last_read_at: string | null
    added_by: number | null
    joined_at: string
    user?: {
        id: number
        name: string
        avatar: string | null
        is_online: boolean
    }
}

export interface IGroup {
    id: number
    name: string
    description?: string
    avatar?: string | null
    created_by: number
    join_mode: "open" | "approval"
    invite_token?: string | null
    invite_expires_at?: string | null
    created_at: string
    member_count?: number
    members: IGroupMember[]
    creator: IGroupCreator
    settings: IGroupSettings
}

export interface IJoinGroupRequest {
    id: number
    group_id: number
    user_id: number
    status: string
    requested_at: Date
    reviewed_by: number
    reviewed_at: Date
}