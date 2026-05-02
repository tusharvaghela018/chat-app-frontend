import Button from "@/common/Button";
import React, { useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    loading?: boolean;
}

const Modal: React.FC<ModalProps> = ({
    open,
    onClose,
    title,
    children,
    loading: localLoading = false
}) => {
    const isGlobalLoading = useSelector((state: RootState) => state.loading.isLoading);
    const isBusy = localLoading || isGlobalLoading;
    const modalRef = useRef<HTMLDivElement>(null);

    if (!open) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (isBusy) return;
        // If the click is on the backdrop (the outer div), close the modal
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={handleBackdropClick}
        >

            <div
                ref={modalRef}
                className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl
        animate-[fadeIn_.2s_ease] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="flex justify-between items-center border-b border-border p-5">

                    <h2 className="font-semibold text-xl text-foreground">
                        {title}
                    </h2>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        disabled={isBusy}
                        className="text-muted-foreground hover:text-foreground rounded-full h-8 w-8"
                    >
                        ✕
                    </Button>

                </div>

                <div className="p-6">
                    {children}
                </div>

            </div>

        </div>
    );
};

export default Modal;