import { useForm } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import Modal from "@/common/Modal"
import Button from "@/common/Button"
import Select from "@/common/ReactSelect"
import { usePostApi, useGetApi } from "@/hooks/api"
import type { IUser } from "@/types"

interface FormValues {
    user: { label: string; value: number } | null
}

interface Props {
    open: boolean
    onClose: () => void
    groupId: number
}

const AddMemberModal = ({ open, onClose, groupId }: Props) => {
    const queryClient = useQueryClient()

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: { user: null },
    })

    const { data: usersData } = useGetApi<IUser[]>("/users")
    const users = Array.isArray(usersData?.data)
        ? usersData.data
        : (usersData?.data as any)?.users ?? []

    const userOptions = users.map((u: IUser) => ({
        label: u.name,
        value: u.id,
    }))

    const { mutate: addMember, isPending } = usePostApi(`/groups/${groupId}/members`)

    const onSubmit = (values: FormValues) => {
        if (!values.user) return

        addMember(
            { user_id: values.user.value } as any,
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: [`group-${groupId}`] })
                    queryClient.invalidateQueries({ queryKey: ["groups-"] })
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
        <Modal open={open} onClose={handleClose} title="Add member">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <Select
                    label="Select user"
                    name="user"
                    control={control}
                    options={userOptions}
                    placeholder="Search users..."
                    // @ts-ignore
                    rules={{ required: "Please select a user" }}
                />

                {errors.user && (
                    <p className="text-sm text-red-500">{errors.user.message}</p>
                )}

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
                        Add member
                    </Button>
                </div>

            </form>
        </Modal>
    )
}

export default AddMemberModal