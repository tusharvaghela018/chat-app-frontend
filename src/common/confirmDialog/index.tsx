import React from "react"
import Modal from "@/common/Modal"
import Button from "@/common/Button"

interface Props {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    variant?: "danger" | "warning" | "info"
    isLoading?: boolean
}

const ConfirmDialog: React.FC<Props> = ({
    open,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    isLoading = false,
}) => {
    const colorMap = {
        danger: "red",
        warning: "yellow",
        info: "blue",
    }

    const color = colorMap[variant]

    return (
        <Modal open={open} onClose={onClose} title={title}>
            <div className="space-y-4">

                <p className="text-sm text-gray-600">{message}</p>

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        color="gray"
                        fullWidth
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        color={color}
                        fullWidth
                        loading={isLoading}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                </div>

            </div>
        </Modal>
    )
}

export default ConfirmDialog