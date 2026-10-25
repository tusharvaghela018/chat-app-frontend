import { useQueryClient } from "@tanstack/react-query"
import { useGetApi, usePatchApi } from "@/hooks/api"
import Modal from "@/common/Modal"
import { UserCheck, Users, Check, X, Loader2 } from "lucide-react"

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

    const renderFooter = (
        <div className="flex items-center justify-end w-full">
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
                Close
            </button>
        </div>
    )

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Join requests"
            subtitle={`${requests.length} pending request${requests.length === 1 ? "" : "s"} waiting for approval`}
            icon={<UserCheck size={20} />}
            maxWidth="max-w-md sm:max-w-lg"
            footer={renderFooter}
        >
            <div className="space-y-3 min-h-[160px]">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <Loader2 size={24} className="animate-spin text-purple-600 mb-2" />
                        <span className="text-xs">Loading requests...</span>
                    </div>
                )}

                {!isLoading && requests.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-center mb-3">
                            <Users size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                            No pending requests
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            New member requests will appear here
                        </p>
                    </div>
                )}

                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {requests.map((req: IJoinRequest) => (
                        <div
                            key={req.id}
                            className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-purple-200 dark:hover:border-purple-900/40 transition-all"
                        >
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                {req.requester.avatar ? (
                                    <img src={req.requester.avatar} className="w-full h-full object-cover" />
                                ) : (
                                    (req.requester.name?.[0] || "U").toUpperCase()
                                )}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {req.requester.name}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                    {req.requester.email}
                                </p>
                                <p className="text-[10px] text-slate-400/80 mt-0.5">
                                    Requested {new Date(req.requested_at).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleReview(req.id, "approved")}
                                    disabled={isPending}
                                    title="Approve"
                                    className="w-8 h-8 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 border border-green-500/20 cursor-pointer active:scale-95"
                                >
                                    <Check size={16} className="stroke-[2.5]" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleReview(req.id, "rejected")}
                                    disabled={isPending}
                                    title="Reject"
                                    className="w-8 h-8 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 border border-red-500/20 cursor-pointer active:scale-95"
                                >
                                    <X size={16} className="stroke-[2.5]" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    )
}

export default JoinRequestsModal