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
    const variantMap: Record<string, "danger" | "primary" | "secondary"> = {
        danger: "danger",
        warning: "primary", // Or I could add a warning variant to Button
        info: "primary",
    }

    const buttonVariant = variantMap[variant]

    return (
        <Modal open={open} onClose={onClose} title={title} loading={isLoading}>
            <div className="space-y-6">

                <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={buttonVariant}
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