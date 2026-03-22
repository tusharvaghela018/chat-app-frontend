import { useForm } from "react-hook-form"
import Modal from "@/common/Modal"
import Input from "@/common/Input"
import Button from "@/common/Button"
import Select from "@/common/ReactSelect"
import { usePostApi, useGetApi } from "@/hooks/api"
import type { IGroup, IUser } from "@/types"
import { useQueryClient } from "@tanstack/react-query"

interface FormValues {
    name: string
    description?: string
    members: { label: string; value: number }[]
    join_mode: { label: string; value: string }
}

interface Props {
    open: boolean
    onClose: () => void
    onCreated: (group: IGroup) => void
}

const CreateGroupModal = ({ open, onClose, onCreated }: Props) => {
    const joinModeOptions = [
        { label: "Open — anyone with link joins instantly", value: "open" },
        { label: "Approval — admin must approve join requests", value: "approval" },
    ]
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: { members: [], join_mode: joinModeOptions[0] },
    })

    const queryClient = useQueryClient()

    const { data: usersData } = useGetApi<IUser[]>("/users")
    const users = Array.isArray(usersData?.data)
        ? usersData.data
        : (usersData?.data as any)?.users ?? []

    const userOptions = users.map((u: IUser) => ({
        label: u.name,
        value: u.id,
    }))

    const { mutate: createGroup, isPending: isCreating } = usePostApi<{ group: IGroup }>("/groups")

    const onSubmit = (values: FormValues) => {
        createGroup(
            {
                name: values.name,
                description: values.description,
                member_ids: values.members.map((m) => m.value),
                join_mode: values.join_mode.value
            } as any,
            {
                onSuccess: (res) => {
                    const group = res?.data?.group
                    queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
                    onCreated(group as IGroup)
                    reset()
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
        <Modal open={open} onClose={handleClose} title="Create group">
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
                    label="Add members (optional)"
                    name="members"
                    control={control}
                    options={userOptions}
                    isMulti
                    placeholder="Search and select people..."
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
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        fullWidth
                        loading={isCreating}
                    >
                        Create group
                    </Button>
                </div>

            </form>
        </Modal>
    )
}

export default CreateGroupModal