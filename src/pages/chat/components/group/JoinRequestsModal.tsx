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
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && requests.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 gap-2">
                        <Users size={32} className="text-gray-300" />
                        <p className="text-sm text-gray-400">No pending requests</p>
                    </div>
                )}

                {requests.map((req: IJoinRequest) => (
                    <div
                        key={req.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
                    >
                        {/* avatar */}
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {req.requester.avatar
                                ? <img src={req.requester.avatar} className="w-10 h-10 rounded-full object-cover" />
                                : <Users size={16} className="text-purple-600" />
                            }
                        </div>

                        {/* info */}
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{req.requester.name}</p>
                            <p className="text-xs text-gray-400 truncate">{req.requester.email}</p>
                            <p className="text-xs text-gray-400">
                                {new Date(req.requested_at).toLocaleDateString()}
                            </p>
                        </div>

                        {/* actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                                onClick={() => handleReview(req.id, "approved")}
                                disabled={isPending}
                                title="Approve"
                                className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center justify-center transition disabled:opacity-40"
                            >
                                <Check size={15} />
                            </Button>
                            <Button
                                onClick={() => handleReview(req.id, "rejected")}
                                disabled={isPending}
                                title="Reject"
                                className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-500 rounded-lg flex items-center justify-center transition disabled:opacity-40"
                            >
                                <X size={15} />
                            </Button>
                        </div>
                    </div>
                ))}

            </div>
        </Modal>
    )
}

export default JoinRequestsModal