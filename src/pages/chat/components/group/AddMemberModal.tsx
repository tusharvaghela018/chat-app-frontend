import { useState, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import Modal from "@/common/Modal"
import { usePostApi, useGetApi } from "@/hooks/api"
import type { IUser } from "@/types"
import { UserPlus, Search, Check, Users, Loader2 } from "lucide-react"

interface Props {
    open: boolean
    onClose: () => void
    groupId: number
    existingMemberIds?: number[]
}

const AddMemberModal = ({ open, onClose, groupId, existingMemberIds = [] }: Props) => {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

    const { data: usersData, isFetching } = useGetApi<IUser[]>("/users")
    const users: IUser[] = useMemo(() => {
        if (Array.isArray(usersData?.data)) return usersData.data
        return (usersData?.data as any)?.users ?? []
    }, [usersData])

    // Filter users by search and identify if already in group
    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase()
        return users.filter((u) => {
            if (!query) return true
            const nameMatch = u.name?.toLowerCase().includes(query)
            const usernameMatch = u.username?.toLowerCase().includes(query)
            return nameMatch || usernameMatch
        })
    }, [users, search])

    const { mutate: addMember, isPending } = usePostApi(`/groups/${groupId}/members`)

    const handleAdd = () => {
        if (!selectedUserId) return

        addMember(
            { user_id: selectedUserId } as any,
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: [`group-${groupId}`] })
                    queryClient.invalidateQueries({ queryKey: ["groups-"] })
                    handleClose()
                },
            }
        )
    }

    const handleClose = () => {
        setSelectedUserId(null)
        setSearch("")
        onClose()
    }

    const selectedUser = users.find((u) => u.id === selectedUserId)

    const renderFooter = (
        <div className="flex items-center justify-end gap-3 w-full">
            <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
                Cancel
            </button>
            <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedUserId || isPending}
                className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
                {isPending ? (
                    <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Adding...</span>
                    </>
                ) : (
                    <span>Add member</span>
                )}
            </button>
        </div>
    )

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Add member"
            subtitle="Search and select a user to add to this group."
            icon={<UserPlus size={20} />}
            maxWidth="max-w-md sm:max-w-lg"
            footer={renderFooter}
        >
            <div className="space-y-3.5">
                {/* Search Bar */}
                <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users by name or username..."
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                    />
                </div>

                {/* Selected User Banner */}
                {selectedUser && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                                Selected:
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {selectedUser.name}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedUserId(null)}
                            className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
                        >
                            Change
                        </button>
                    </div>
                )}

                {/* Users List */}
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {isFetching && users.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-slate-400">
                            <Loader2 size={20} className="animate-spin text-purple-600 mr-2" />
                            <span className="text-xs">Loading users...</span>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                            <Users size={28} className="mb-2 text-slate-300 dark:text-slate-600" />
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                {search ? "No users matching your search" : "No users available"}
                            </p>
                        </div>
                    ) : (
                        filteredUsers.map((u) => {
                            const isAlreadyMember = existingMemberIds.includes(u.id)
                            const isSelected = selectedUserId === u.id

                            return (
                                <div
                                    key={u.id}
                                    onClick={() => {
                                        if (isAlreadyMember) return
                                        setSelectedUserId(isSelected ? null : u.id)
                                    }}
                                    className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                                        isAlreadyMember
                                            ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/30"
                                            : isSelected
                                                ? "bg-purple-50 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800 ring-1 ring-purple-500/20"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                            {u.avatar ? (
                                                <img src={u.avatar} className="h-full w-full object-cover" />
                                            ) : (
                                                (u.name?.[0] || u.username?.[0] || "U").toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                                {u.name}
                                            </p>
                                            <p className="text-[11px] text-slate-400 truncate">
                                                @{u.username}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action / Selection indicator */}
                                    <div className="flex-shrink-0 ml-2">
                                        {isAlreadyMember ? (
                                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                Member
                                            </span>
                                        ) : (
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                                    isSelected
                                                        ? "bg-purple-600 text-white shadow-xs"
                                                        : "border-2 border-slate-300 dark:border-slate-600"
                                                }`}
                                            >
                                                {isSelected && <Check size={13} className="stroke-[3]" />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </Modal>
    )
}

export default AddMemberModal