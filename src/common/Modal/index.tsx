import React from "react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
    open,
    onClose,
    title,
    children
}) => {

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

            <div
                className="w-full max-w-lg rounded-xl bg-white shadow-lg
        animate-[fadeIn_.2s_ease]"
            >

                <div className="flex justify-between items-center border-b p-4">

                    <h2 className="font-semibold text-lg">
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-black"
                    >
                        ✕
                    </button>

                </div>

                <div className="p-4">
                    {children}
                </div>

            </div>

        </div>
    );
};

export default Modal;