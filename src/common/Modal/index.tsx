import Button from "@/common/Button";
import React, { useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    loading?: boolean;
    maxWidth?: string;
    hideHeader?: boolean;
    noPadding?: boolean;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({
    open,
    onClose,
    title,
    subtitle,
    icon,
    children,
    footer,
    loading: localLoading = false,
    maxWidth = "max-w-lg",
    hideHeader = false,
    noPadding = false,
    className = "",
}) => {
    const isBusy = localLoading;
    const modalRef = useRef<HTMLDivElement>(null);

    if (!open) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (isBusy) return;
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const handleClose = () => {
        if (isBusy) return;
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className={`w-full ${maxWidth} my-auto max-h-[88vh] sm:max-h-[85vh] flex flex-col rounded-2xl sm:rounded-3xl bg-card border border-border shadow-2xl animate-[fadeIn_.2s_ease] overflow-hidden ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fixed Top Header */}
                {!hideHeader && (title || icon) && (
                    <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3.5 sm:py-4 flex-shrink-0 bg-card">
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                            {icon && (
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
                                    {icon}
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <h2 className="font-bold text-base sm:text-lg text-foreground truncate">
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className="text-[11px] sm:text-xs text-muted-foreground truncate mt-0.5">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            disabled={isBusy}
                            className="text-muted-foreground hover:text-foreground rounded-full h-8 w-8 shrink-0"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </Button>
                    </div>
                )}

                {/* Scrollable Middle Body */}
                <div className={`overflow-y-auto custom-scrollbar flex-1 ${noPadding ? "" : "p-4 sm:p-6"}`}>
                    {children}
                </div>

                {/* Fixed Bottom Footer (Buttons are NEVER scrollable) */}
                {footer && (
                    <div className="border-t border-border px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 bg-card/95 backdrop-blur-xs">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;