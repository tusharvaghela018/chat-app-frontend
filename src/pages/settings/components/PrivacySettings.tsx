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
                className="flex w-full items-center justify-between p-4 sm:p-6 transition-colors hover:bg-muted/50"
            >
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Shield size={20} className="sm:size-[22px]" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-base sm:text-lg font-bold">Privacy</h2>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Blocked users and visibility</p>
                    </div>
                </div>
                <ChevronDown 
                    size={18} 
                    className={`text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
                />
            </button>

            {isOpen && (
                <div className="border-t bg-card/50 p-4 sm:p-6 pt-0 animate-in slide-in-from-top-2 duration-300">
                    <div className="mt-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2">
                                <Ban size={15} className="text-red-500" />
                                Blocked Users
                            </h3>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">
                                {blockedUsers.length} Users
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 size={24} className="animate-spin text-primary" />
                            </div>
                        ) : blockedUsers.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-6 sm:p-8 text-center bg-background/50">
                                <p className="text-xs sm:text-sm text-muted-foreground">No blocked users yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border overflow-hidden rounded-xl border bg-background shadow-sm">
                                {blockedUsers.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0 mr-2">
                                            <div className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 overflow-hidden rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {item.user.avatar 
                                                    ? <img src={item.user.avatar} className="h-full w-full object-cover" />
                                                    : <User size={16} className="sm:size-18" />
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-xs sm:text-sm font-bold">{item.user.name}</p>
                                                <p className="truncate text-[10px] sm:text-[11px] text-muted-foreground">@{item.user.username}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUnblock(item.id)}
                                            className="rounded-xl h-8 px-3 text-[10px] sm:text-[11px] font-bold border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                                        >
                                            Unblock
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed italic bg-muted/30 p-2.5 rounded-lg border border-border/50">
                            Blocked users cannot message you or see your status.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PrivacySettings
