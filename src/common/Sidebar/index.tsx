import React from "react";
import { X } from "lucide-react";
import Button from "@/common/Button";

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    width?: string;
    position?: "left" | "right";
    title?: string;
    children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({
    open,
    onClose,
    width = "w-64",
    position = "left",
    title = "Menu",
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
                className={`fixed top-0 ${sidePosition} h-screen bg-card text-foreground z-50
                    transform transition-transform duration-300 flex flex-col shadow-2xl border-l border-border
                    ${width}
                    ${translateClass}`}
            >

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                    <h2 className="font-semibold text-lg">{title}</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground rounded-full"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {/* Content — scrollable */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {children}
                </div>

            </div>
        </>
    );
};

export default Sidebar;