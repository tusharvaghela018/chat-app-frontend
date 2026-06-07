import { useState } from "react"
import { Shield, ChevronDown, User, Ban, Loader2 } from "lucide-react"
import { useGetApi, usePatchApi } from "@/hooks/api"
import { useQueryClient } from "@tanstack/react-query"
import Button from "@/common/Button"

interface BlockedUser {
    id: number
    blocked_at: string
    user: {
        id: number
        name: string
        username: string
        avatar: string | null
    }
}

const PrivacySettings = () => {
    const queryClient = useQueryClient()
    const [isOpen, setIsOpen] = useState(true)

    const { data: blockedData, isLoading } = useGetApi<BlockedUser[]>(
        "/conversations/blocked",
        undefined,
        { queryKey: 'blocked-users' }
    )

    const blockedUsers = (blockedData?.data || []) as BlockedUser[]

    const { mutate: updateBlockStatus } = usePatchApi("/conversations")

    const handleUnblock = (conversationId: number) => {
        updateBlockStatus({ 
            id: `${conversationId}/block`,
            body: { block: false } 
        }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
                queryClient.invalidateQueries({ queryKey: ['conversations'] })
            }
        })
    }

    return (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-6 transition-colors hover:bg-muted/50"
            >
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Shield size={22} />
                    </div>
                    <div className="text-left">
                        <h2 className="text-lg font-bold">Privacy</h2>
                        <p className="text-xs text-muted-foreground">Manage blocked users and visibility</p>
                    </div>
                </div>
                <ChevronDown 
                    size={20} 
                    className={`text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
                />
            </button>

            {isOpen && (
                <div className="border-t bg-card/50 p-6 pt-0 animate-in slide-in-from-top-2 duration-300">
                    <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Ban size={16} className="text-red-500" />
                                Blocked Users
                            </h3>
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                                {blockedUsers.length} Users
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 size={24} className="animate-spin text-primary" />
                            </div>
                        ) : blockedUsers.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-8 text-center">
                                <p className="text-sm text-muted-foreground">You haven't blocked anyone yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border overflow-hidden rounded-xl border bg-background">
                                {blockedUsers.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 overflow-hidden rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {item.user.avatar 
                                                    ? <img src={item.user.avatar} className="h-full w-full object-cover" />
                                                    : <User size={18} />
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold">{item.user.name}</p>
                                                <p className="truncate text-[11px] text-muted-foreground">@{item.user.username}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUnblock(item.id)}
                                            className="rounded-xl h-8 text-[11px] font-bold border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600"
                                        >
                                            Unblock
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                            Blocked users cannot send you messages or see your online status. They won't be notified when you block them.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PrivacySettings
