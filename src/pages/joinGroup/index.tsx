import { useParams, useNavigate } from "react-router-dom"
import { usePostApi } from "@/hooks/api"
import { Users } from "lucide-react"
import { ROUTES } from "@/constants/routes"
import type { IGroup, IJoinGroupRequest } from "@/types"
import Button from "@/common/Button"

interface JoinGroupResponse {
    group?: IGroup
    group_id?: number
    request?: IJoinGroupRequest
}

const JoinGroupPage = () => {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()

    const { mutate: joinGroup, isPending, isSuccess, data } = usePostApi<JoinGroupResponse>(
        `/groups/join/${token}`
    )

    const response = data?.data

    const handleJoin = () => {
        joinGroup({} as any, {
            onSuccess: (res) => {
                const resData = res.data

                // already a member — redirect to chat
                if (resData?.group_id) {
                    navigate(ROUTES.CHAT.path, {
                        replace: true,
                        state: { openGroupId: resData.group_id }  // pass group id to auto select
                    })
                    return
                }

                // open mode — joined instantly → redirect after short delay
                if (resData?.group) {
                    setTimeout(() => {
                        navigate(ROUTES.CHAT.path, {
                            replace: true,
                            state: { openGroupId: resData.group?.id }
                        })
                    }, 1500)
                }

                // approval mode — stay on page to show pending state
            },
        })
    }

    // approval mode — request sent
    if (isSuccess && response?.request) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-3 max-w-sm px-4">
                    <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-2xl">⏳</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">Request sent</p>
                    <p className="text-sm text-gray-500">
                        Your request to join this group is pending admin approval.
                        You'll be notified once approved.
                    </p>
                    <button
                        onClick={() => navigate(ROUTES.CHAT.path)}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Go to chats
                    </button>
                </div>
            </div>
        )
    }

    // open mode — joined successfully
    if (isSuccess && response?.group) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-3 max-w-sm px-4">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-2xl">✓</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">Joined successfully!</p>
                    <p className="text-sm text-gray-500">Redirecting to your group...</p>
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            </div>
        )
    }

    // default — show join button
    return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-5 max-w-sm px-4">

                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Users size={28} className="text-purple-600" />
                </div>

                <div>
                    <p className="text-lg font-semibold text-gray-800">You've been invited</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Click the button below to join the group.
                    </p>
                </div>

                <Button
                    onClick={handleJoin}
                    disabled={isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-medium transition disabled:opacity-40 flex items-center justify-center gap-2"
                >
                    {isPending && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {isPending ? "Joining..." : "Join group"}
                </Button>

                <button
                    onClick={() => navigate(ROUTES.CHAT.path)}
                    className="text-sm text-gray-400 hover:text-gray-600 transition"
                >
                    Cancel
                </button>

            </div>
        </div>
    )
}

export default JoinGroupPage