import { useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import Modal from "@/common/Modal"
import Select from "@/common/ReactSelect"
import { usePostApi, useGetApi } from "@/hooks/api"
import type { IGroup, IUser } from "@/types"
import { Camera, Users, ShieldCheck, PlusCircle, Loader2 } from "lucide-react"

interface FormValues {
    name: string
    description?: string
    members: { label: string; value: number }[]
    join_mode: "open" | "approval"
}

interface Props {
    open: boolean
    onClose: () => void
    onCreated: (group: IGroup) => void
}

const CreateGroupModal = ({ open, onClose, onCreated }: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: { members: [], join_mode: "open" },
    })

    const nameValue = watch("name", "") || ""
    const descValue = watch("description", "") || ""

    const queryClient = useQueryClient()

    const { data: usersData } = useGetApi<IUser[]>("/users")
    const users = Array.isArray(usersData?.data)
        ? usersData.data
        : (usersData?.data as any)?.users ?? []

    const userOptions = users.map((u: IUser) => ({
        label: u.name,
        value: u.id,
    }))

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
    }

    const { mutate: createGroup, isPending: isCreating } = usePostApi<{ group: IGroup }>("/groups")

    const onSubmit = (values: FormValues) => {
        const formData = new FormData()
        formData.append("name", values.name)
        if (values.description) formData.append("description", values.description)
        formData.append("join_mode", values.join_mode)
        values.members.forEach((m) => formData.append("member_ids[]", String(m.value)))
        if (avatarFile) formData.append("avatar", avatarFile)

        createGroup(formData as any, {
            onSuccess: (res) => {
                const group = res?.data?.group
                queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
                onCreated(group as IGroup)
                handleClose()
            },
        })
    }

    const handleClose = () => {
        reset()
        setAvatarPreview(null)
        setAvatarFile(null)
        onClose()
    }

    const renderFooter = (
        <div className="flex items-center justify-end gap-3 w-full">
            <button
                type="button"
                onClick={handleClose}
                disabled={isCreating}
                className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
                Cancel
            </button>
            <button
                type="submit"
                form="create-group-form"
                disabled={isCreating}
                className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
                {isCreating ? (
                    <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Creating...</span>
                    </>
                ) : (
                    <span>Create group</span>
                )}
            </button>
        </div>
    )

    return (
        <Modal 
            open={open} 
            onClose={handleClose} 
            title="Create New Group"
            subtitle="Set up your group space, name, and initial members."
            icon={<PlusCircle size={20} />}
            maxWidth="max-w-lg sm:max-w-xl"
            footer={renderFooter}
        >
            <form id="create-group-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Avatar with Camera Overlay */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md overflow-hidden border-2 border-white dark:border-slate-800">
                            {avatarPreview ? (
                                <img src={avatarPreview} className="w-full h-full object-cover" />
                            ) : (
                                <Users size={32} />
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover/avatar:scale-110 transition-transform">
                            <Camera size={13} />
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                        Upload Group Photo
                    </button>
                </div>

                {/* Group Name */}
                <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Group name
                    </label>
                    <input
                        {...register("name", {
                            required: "Group name is required",
                            minLength: { value: 3, message: "Name must be at least 3 characters" },
                            maxLength: { value: 50, message: "Max 50 characters" },
                        })}
                        maxLength={50}
                        placeholder="e.g. Design Team"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                    />
                    <div className="flex items-center justify-between mt-1">
                        {errors.name ? (
                            <p className="text-[11px] text-rose-500 font-medium">{errors.name.message}</p>
                        ) : <span />}
                        <span className="text-[10px] text-slate-400 tabular-nums">
                            {nameValue.length}/50
                        </span>
                    </div>
                </div>

                {/* Description (optional) */}
                <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Description (optional)
                    </label>
                    <textarea
                        {...register("description", {
                            maxLength: { value: 200, message: "Max 200 characters" },
                        })}
                        maxLength={200}
                        rows={2.5}
                        placeholder="What's this group about?"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all resize-none"
                    />
                    <div className="flex items-center justify-between mt-1">
                        <span />
                        <span className="text-[10px] text-slate-400 tabular-nums">
                            {descValue.length}/200
                        </span>
                    </div>
                </div>

                {/* Initial Members Multi-Select */}
                <div>
                    <Select
                        label="Add initial members (optional)"
                        name="members"
                        control={control}
                        options={userOptions}
                        isMulti
                        placeholder="Search and select people..."
                    />
                </div>

                {/* Join Mode (2-Option Toggle instead of dropdown) */}
                <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Join mode
                    </label>
                    <Controller
                        name="join_mode"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-1.5">
                                <div className="flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                                    <button
                                        type="button"
                                        onClick={() => field.onChange("open")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                            field.value === "open"
                                                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs font-bold"
                                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <Users size={14} />
                                        <span>Open (Instant)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => field.onChange("approval")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                            field.value === "approval"
                                                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs font-bold"
                                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <ShieldCheck size={14} />
                                        <span>Approval Required</span>
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-1 leading-snug">
                                    {field.value === "open"
                                        ? "Anyone with the invite link can join immediately."
                                        : "New members need admin approval before joining."
                                    }
                                </p>
                            </div>
                        )}
                    />
                </div>
            </form>
        </Modal>
    )
}

export default CreateGroupModal