import React from "react"
import Modal from "@/common/Modal"
import { AlertTriangle, AlertCircle, Info, Loader2 } from "lucide-react"

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
    const iconConfig = {
        danger: {
            icon: <AlertTriangle size={20} />,
            badge: "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400",
            btn: "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20",
        },
        warning: {
            icon: <AlertCircle size={20} />,
            badge: "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
            btn: "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20",
        },
        info: {
            icon: <Info size={20} />,
            badge: "bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400",
            btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20",
        },
    }[variant]

    const renderFooter = (
        <div className="flex items-center justify-end gap-3 w-full">
            <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
                {cancelText}
            </button>
            <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 ${iconConfig.btn}`}
            >
                {isLoading ? (
                    <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Processing...</span>
                    </>
                ) : (
                    <span>{confirmText}</span>
                )}
            </button>
        </div>
    )

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            icon={
                <div className={`w-full h-full rounded-xl sm:rounded-2xl flex items-center justify-center ${iconConfig.badge}`}>
                    {iconConfig.icon}
                </div>
            }
            maxWidth="max-w-sm sm:max-w-md"
            footer={renderFooter}
            loading={isLoading}
        >
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed py-1">
                {message}
            </p>
        </Modal>
    )
}

export default ConfirmDialog