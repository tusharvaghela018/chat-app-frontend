import { useQueryClient } from "@tanstack/react-query"
import { useGetApi, usePatchApi } from "@/hooks/api"
import Modal from "@/common/Modal"
import { Users, Check, X } from "lucide-react"
import Button from "@/common/Button"

interface IJoinRequest {
    id: number
    group_id: number
    user_id: number
    status: string
    requested_at: string
    requester: {
        id: number
        name: string
        avatar: string | null
        email: string
    }
}

interface Props {
    open: boolean
    onClose: () => void
    groupId: number
}

const JoinRequestsModal = ({ open, onClose, groupId }: Props) => {
    const queryClient = useQueryClient()

    const { data, isLoading, refetch } = useGetApi<IJoinRequest[]>(
        `/groups/${groupId}/join-requests`,
        undefined,
        {
            queryKey: `join-requests-${groupId}`,
            enabled: open,
        }
    )

    const requests = (data?.data as any)?.requests ?? []

    const { mutate: reviewRequest, isPending } = usePatchApi(
        `/groups/${groupId}/join-requests`
    )

    const handleReview = (requestId: number, status: "approved" | "rejected") => {
        reviewRequest(
            { id: requestId, body: { status } },
            {
                onSuccess: () => {
                    refetch()
                    if (status === "approved") {
                        queryClient.invalidateQueries({ queryKey: [`group-${groupId}`] })
                        queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
                    }
                },
            }
        )
    }

    return (
        <Modal open={open} onClose={onClose} title="Join requests">
            <div className="space-y-3 min-h-[200px]">

                {isLoading && (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 animate-pulse p-3">
                                <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-1/2" />
                                    <div className="h-3 bg-muted/60 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && requests.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <Users size={32} className="text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No pending requests</p>
                    </div>
                )}

                <div className="space-y-2">
                    {requests.map((req: IJoinRequest) => (
                        <div
                            key={req.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors"
                        >
                            {/* avatar */}
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 border border-primary/20">
                                {req.requester.avatar
                                    ? <img src={req.requester.avatar} className="w-10 h-10 rounded-full object-cover" />
                                    : <Users size={16} className="text-primary" />
                                }
                            </div>

                            {/* info */}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground truncate">{req.requester.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{req.requester.email}</p>
                                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                    {new Date(req.requested_at).toLocaleDateString()}
                                </p>
                            </div>

                            {/* actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                    size="icon"
                                    onClick={() => handleReview(req.id, "approved")}
                                    disabled={isPending}
                                    title="Approve"
                                    className="w-8 h-8 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 border border-green-500/20"
                                >
                                    <Check size={16} />
                                </Button>
                                <Button
                                    size="icon"
                                    onClick={() => handleReview(req.id, "rejected")}
                                    disabled={isPending}
                                    title="Reject"
                                    className="w-8 h-8 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 border border-destructive/20"
                                >
                                    <X size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </Modal>
    )
}

export default JoinRequestsModal