import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import Modal from "@/common/Modal"
import Button from "@/common/Button"
import Select from "@/common/ReactSelect"
import { usePatchApi } from "@/hooks/api"
import type { IGroupSettings } from "@/types"

interface FormValues {
    who_can_send: { label: string; value: string }
    who_can_edit_info: { label: string; value: string }
    who_can_add_members: { label: string; value: string }
    who_can_remove_members: { label: string; value: string }
    who_can_share_link: { label: string; value: string }
}

interface Props {
    open: boolean
    onClose: () => void
    groupId: number
    settings: IGroupSettings
}

const memberOptions = [
    { label: "Admins only", value: "admins" },
    { label: "All members", value: "members" },
]

const toOption = (value: string, options: { label: string; value: string }[]) =>
    options.find((o) => o.value === value) ?? options[0]

const GroupSettingsModal = ({ open, onClose, groupId, settings }: Props) => {
    const queryClient = useQueryClient()

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            who_can_send: toOption(settings.who_can_send, memberOptions),
            who_can_edit_info: toOption(settings.who_can_edit_info, memberOptions),
            who_can_add_members: toOption(settings.who_can_add_members, memberOptions),
            who_can_remove_members: toOption(settings.who_can_remove_members, memberOptions),
            who_can_share_link: toOption(settings.who_can_share_link, memberOptions),
        },
    })

    // reset form when settings change
    useEffect(() => {
        reset({
            who_can_send: toOption(settings.who_can_send, memberOptions),
            who_can_edit_info: toOption(settings.who_can_edit_info, memberOptions),
            who_can_add_members: toOption(settings.who_can_add_members, memberOptions),
            who_can_remove_members: toOption(settings.who_can_remove_members, memberOptions),
            who_can_share_link: toOption(settings.who_can_share_link, memberOptions),
        })
    }, [settings])

    const { mutate: updateSettings, isPending } = usePatchApi(`/groups/${groupId}/settings`)

    const onSubmit = (values: FormValues) => {
        updateSettings(
            {
                body: {
                    who_can_send: values.who_can_send.value,
                    who_can_edit_info: values.who_can_edit_info.value,
                    who_can_add_members: values.who_can_add_members.value,
                    who_can_remove_members: values.who_can_remove_members.value,
                    who_can_share_link: values.who_can_share_link.value,
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

    return (
        <Modal open={open} onClose={handleClose} title="Group settings">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <Select
                    label="Who can send messages"
                    name="who_can_send"
                    control={control}
                    options={memberOptions}
                />

                <Select
                    label="Who can edit group info"
                    name="who_can_edit_info"
                    control={control}
                    options={memberOptions}
                />

                <Select
                    label="Who can add members"
                    name="who_can_add_members"
                    control={control}
                    options={memberOptions}
                />

                <Select
                    label="Who can remove members"
                    name="who_can_remove_members"
                    control={control}
                    options={memberOptions}
                />

                <Select
                    label="Who can share invite link"
                    name="who_can_share_link"
                    control={control}
                    options={memberOptions}
                />

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        color="gray"
                        fullWidth
                        onClick={handleClose}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        fullWidth
                        loading={isPending}
                    >
                        Save settings
                    </Button>
                </div>

            </form>
        </Modal>
    )
}

export default GroupSettingsModal