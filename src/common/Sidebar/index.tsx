import React from "react";
import { X } from "lucide-react";

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    width?: string;
    position?: "left" | "right";
    children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({
    open,
    onClose,
    width = "w-64",
    position = "left",
    children
}) => {

    const sidePosition = position === "left" ? "left-0" : "right-0";

    const translateClass =
        position === "left"
            ? open
                ? "translate-x-0"
                : "-translate-x-full"
            : open
                ? "translate-x-0"
                : "translate-x-full";

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300
        ${open ? "opacity-100 visible" : "opacity-0 invisible"}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={`fixed top-0 ${sidePosition} h-screen bg-gray-900 text-white z-50
        transform transition-transform duration-300
        ${width}
        ${translateClass}`}
            >

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="font-semibold">Menu</h2>

                    <button onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-3 flex flex-col gap-2">
                    {children}
                </div>

            </div>
        </>
    );
};

export default Sidebar;