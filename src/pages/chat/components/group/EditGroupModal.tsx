import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import Modal from "@/common/Modal"
import Input from "@/common/Input"
import Button from "@/common/Button"
import { usePatchApi } from "@/hooks/api"
import type { IGroup } from "@/types"
import Select from "@/common/ReactSelect"

interface FormValues {
    name: string
    description?: string
    join_mode: { label: string; value: string }
}

interface Props {
    open: boolean
    onClose: () => void
    group: IGroup
}

const EditGroupModal = ({ open, onClose, group }: Props) => {
    const queryClient = useQueryClient()

    const joinModeOptions = [
        { label: "Open — anyone with link joins instantly", value: "open" },
        { label: "Approval — admin must approve join requests", value: "approval" },
    ]

    const toJoinModeOption = (value: string) =>
        joinModeOptions.find((o) => o.value === value) ?? joinModeOptions[0]

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        control
    } = useForm<FormValues>({
        defaultValues: {
            name: group.name,
            description: group.description ?? "",
            join_mode: toJoinModeOption(group.join_mode),
        },
    })

    // reset form when group changes
    useEffect(() => {
        reset({
            name: group.name,
            description: group.description ?? "",
            join_mode: toJoinModeOption(group.join_mode),
        })
    }, [group])

    const { mutate: updateGroup, isPending } = usePatchApi(`/groups/${group.id}`)

    const onSubmit = (values: FormValues) => {
        updateGroup(
            {
                body: {
                    name: values.name,
                    description: values.description,
                    join_mode: values.join_mode.value,  // ← add this
                }
            } as any,
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: [`group-${group.id}`] })
                    queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
                    onClose()
                },
            }
        )
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    return (
        <Modal open={open} onClose={handleClose} title="Edit group">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <Input
                    label="Group name"
                    placeholder="e.g. Design team"
                    error={errors.name?.message}
                    register={register("name", {
                        required: "Group name is required",
                        minLength: {
                            value: 3,
                            message: "Name must be at least 3 characters",
                        },
                    })}
                />

                <Input
                    label="Description (optional)"
                    placeholder="What's this group about?"
                    register={register("description")}
                />

                <Select
                    label="Join mode"
                    name="join_mode"
                    control={control}
                    options={joinModeOptions}
                    placeholder="Select join mode..."
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
                        Save changes
                    </Button>
                </div>

            </form>
        </Modal>
    )
}

export default EditGroupModal