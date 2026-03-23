import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import Modal from "@/common/Modal"
import Input from "@/common/Input"
import Button from "@/common/Button"
import { usePatchApi } from "@/hooks/api"
import type { IGroup } from "@/types"
import Select from "@/common/ReactSelect"
import { Camera, Users } from "lucide-react"

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
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
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
        setAvatarPreview(null)
        setAvatarFile(null)
    }, [group])

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
        formData.append("join_mode", values.join_mode.value)
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

    return (
        <Modal open={open} onClose={handleClose} title="Edit group">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                            {currentAvatar
                                ? <img src={currentAvatar} className="w-20 h-20 object-cover" />
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