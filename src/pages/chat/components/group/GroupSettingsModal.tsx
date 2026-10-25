import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import Modal from "@/common/Modal"
import { usePatchApi } from "@/hooks/api"
import type { IGroupSettings } from "@/types"
import { Settings, MessageSquare, Pencil, UserPlus, UserMinus, Link2 } from "lucide-react"

interface FormValues {
    who_can_send: "members" | "admins"
    who_can_edit_info: "members" | "admins"
    who_can_add_members: "members" | "admins"
    who_can_remove_members: "members" | "admins"
    who_can_share_link: "members" | "admins"
}

interface Props {
    open: boolean
    onClose: () => void
    groupId: number
    groupName?: string
    settings: IGroupSettings
}

interface SettingRowProps {
    icon: React.ReactNode
    title: string
    subtitle: string
    value: "members" | "admins"
    onChange: (val: "members" | "admins") => void
}

const SettingToggleRow = ({ icon, title, subtitle, value, onChange }: SettingRowProps) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-purple-200 dark:hover:border-purple-900/40 transition-colors">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {subtitle}
                    </p>
                </div>
            </div>

            {/* 2-Option Segmented Toggle (Replaces Dropdown, responsive on mobile) */}
            <div className="flex w-full sm:w-auto p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shrink-0">
                <button
                    type="button"
                    onClick={() => onChange("members")}
                    className={`flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        value === "members"
                            ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                    All members
                </button>
                <button
                    type="button"
                    onClick={() => onChange("admins")}
                    className={`flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        value === "admins"
                            ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                    Admins only
                </button>
            </div>
        </div>
    )
}

const GroupSettingsModal = ({ open, onClose, groupId, groupName = "this group", settings }: Props) => {
    const queryClient = useQueryClient()

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            who_can_send: (settings.who_can_send as any) || "members",
            who_can_edit_info: (settings.who_can_edit_info as any) || "admins",
            who_can_add_members: (settings.who_can_add_members as any) || "members",
            who_can_remove_members: (settings.who_can_remove_members as any) || "admins",
            who_can_share_link: (settings.who_can_share_link as any) || "members",
        },
    })

    useEffect(() => {
        reset({
            who_can_send: (settings.who_can_send as any) || "members",
            who_can_edit_info: (settings.who_can_edit_info as any) || "admins",
            who_can_add_members: (settings.who_can_add_members as any) || "members",
            who_can_remove_members: (settings.who_can_remove_members as any) || "admins",
            who_can_share_link: (settings.who_can_share_link as any) || "members",
        })
    }, [settings, reset])

    const { mutate: updateSettings, isPending } = usePatchApi(`/groups/${groupId}/settings`)

    const onSubmit = (values: FormValues) => {
        updateSettings(
            {
                body: {
                    who_can_send: values.who_can_send,
                    who_can_edit_info: values.who_can_edit_info,
                    who_can_add_members: values.who_can_add_members,
                    who_can_remove_members: values.who_can_remove_members,
                    who_can_share_link: values.who_can_share_link,
                },
            } as any,
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: [`group-${groupId}`] })
                    queryClient.invalidateQueries({ queryKey: ["groups-"] })
                    onClose()
                },
                onError: () => {
                    onClose()
                }
            }
        )
    }

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
                form="group-settings-form"
                disabled={isPending}
                className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
                {isPending ? "Saving..." : "Save settings"}
            </button>
        </div>
    )

    return (
        <Modal 
            open={open} 
            onClose={handleClose} 
            title="Group Settings"
            subtitle={`Manage permissions and controls for ${groupName}.`}
            icon={<Settings size={20} />}
            maxWidth="max-w-xl sm:max-w-2xl" 
            footer={renderFooter}
        >
            <form id="group-settings-form" onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
                <Controller
                    name="who_can_send"
                    control={control}
                    render={({ field }) => (
                        <SettingToggleRow
                            icon={<MessageSquare size={17} />}
                            title="Who can send messages"
                            subtitle="Choose who can send messages in this group."
                            value={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />

                <Controller
                    name="who_can_edit_info"
                    control={control}
                    render={({ field }) => (
                        <SettingToggleRow
                            icon={<Pencil size={17} />}
                            title="Who can edit group info"
                            subtitle="Choose who can edit the group name, photo and description."
                            value={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />

                <Controller
                    name="who_can_add_members"
                    control={control}
                    render={({ field }) => (
                        <SettingToggleRow
                            icon={<UserPlus size={17} />}
                            title="Who can add members"
                            subtitle="Choose who can add new members to this group."
                            value={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />

                <Controller
                    name="who_can_remove_members"
                    control={control}
                    render={({ field }) => (
                        <SettingToggleRow
                            icon={<UserMinus size={17} />}
                            title="Who can remove members"
                            subtitle="Choose who can remove members from this group."
                            value={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />

                <Controller
                    name="who_can_share_link"
                    control={control}
                    render={({ field }) => (
                        <SettingToggleRow
                            icon={<Link2 size={17} />}
                            title="Who can share invite link"
                            subtitle="Choose who can share the group invite link."
                            value={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />
            </form>
        </Modal>
    )
}

export default GroupSettingsModal