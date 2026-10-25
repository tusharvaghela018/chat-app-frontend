import { useEffect, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import Modal from "@/common/Modal"
import { usePatchApi } from "@/hooks/api"
import type { IGroup } from "@/types"
import { Camera, Users, ShieldCheck, Pencil } from "lucide-react"

interface FormValues {
    name: string
    description?: string
    join_mode: "open" | "approval"
}

interface Props {
    open: boolean
    onClose: () => void
    group: IGroup
}

const EditGroupModal = ({ open, onClose, group }: Props) => {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: {
            name: group.name,
            description: group.description ?? "",
            join_mode: (group.join_mode as any) || "open",
        },
    })

    const nameValue = watch("name", group.name) || ""
    const descValue = watch("description", group.description || "") || ""

    useEffect(() => {
        reset({
            name: group.name,
            description: group.description ?? "",
            join_mode: (group.join_mode as any) || "open",
        })
        setAvatarPreview(null)
        setAvatarFile(null)
    }, [group, reset])

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
    }

    const { mutate: updateGroup, isPending } = usePatchApi(`/groups/${group.id}`)

    const onSubmit = (values: FormValues) => {
        const formData = new FormData()
        formData.append("name", values.name)
        if (values.description) formData.append("description", values.description)
        formData.append("join_mode", values.join_mode)
        if (avatarFile) formData.append("avatar", avatarFile)

        updateGroup({ body: formData } as any, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: [`group-${group.id}`] })
                queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
                onClose()
            },
        })
    }

    const currentAvatar = avatarPreview ?? group.avatar

    const handleClose = () => {
        reset()
        onClose()
    }

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
                type="submit"
                form="edit-group-form"
                disabled={isPending}
                className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
                {isPending ? "Saving..." : "Save changes"}
            </button>
        </div>
    )

    return (
        <Modal 
            open={open} 
            onClose={handleClose} 
            title="Edit Group Details"
            subtitle="Update your group name, description, and settings."
            icon={<Pencil size={20} />}
            maxWidth="max-w-lg sm:max-w-xl" 
            footer={renderFooter}
        >
            <form id="edit-group-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Avatar with Camera Overlay & Change Link */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md overflow-hidden border-2 border-white dark:border-slate-800">
                            {currentAvatar ? (
                                <img src={currentAvatar} className="w-full h-full object-cover" />
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
                        Change Group Photo
                    </button>
                </div>

                {/* Group Name Field */}
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

                {/* Description Field */}
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
                        {errors.description ? (
                            <p className="text-[11px] text-rose-500 font-medium">{errors.description.message}</p>
                        ) : <span />}
                        <span className="text-[10px] text-slate-400 tabular-nums">
                            {descValue.length}/200
                        </span>
                    </div>
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

export default EditGroupModal