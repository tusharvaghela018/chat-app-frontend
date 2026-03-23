import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import Modal from "@/common/Modal"
import Input from "@/common/Input"
import Button from "@/common/Button"
import Select from "@/common/ReactSelect"
import { usePostApi, useGetApi } from "@/hooks/api"
import type { IGroup, IUser } from "@/types"
import { Camera, Users } from "lucide-react"

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

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
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

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
    }

    const { mutate: createGroup, isPending: isCreating } = usePostApi<{ group: IGroup }>("/groups")

    // update onSubmit to use FormData
    const onSubmit = (values: FormValues) => {
        const formData = new FormData()
        formData.append("name", values.name)
        if (values.description) formData.append("description", values.description)
        formData.append("join_mode", values.join_mode.value)
        values.members.forEach((m) => formData.append("member_ids[]", String(m.value)))
        if (avatarFile) formData.append("avatar", avatarFile)

        createGroup(formData as any, {
            onSuccess: (res) => {
                const group = res?.data?.group
                queryClient.invalidateQueries({ queryKey: ["groups-"], exact: false })
                onCreated(group as IGroup)
                reset()
                setAvatarPreview(null)
                setAvatarFile(null)
                onClose()
            },
        })
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    return (
        <Modal open={open} onClose={handleClose} title="Create group">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                            {avatarPreview
                                ? <img src={avatarPreview} className="w-20 h-20 object-cover" />
                                : <Users size={32} className="text-purple-400" />
                            }
                        </div>
                        <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition"
                        >
                            <Camera size={13} className="text-white" />
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>
                </div>

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