import React from "react";

type LoaderProps = {
    size?: "sm" | "md" | "lg";
    fullScreen?: boolean;
    className?: string;
};

const sizeMap = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
};

const Loader: React.FC<LoaderProps> = ({
    size = "md",
    fullScreen = false,
    className = "",
}) => {
    return (
        <div
            className={`flex items-center justify-center ${fullScreen
                ? "fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
                : ""
                } ${className}`}
        >
            <div
                className={`animate-spin rounded-full border-muted border-t-primary ${sizeMap[size]}`}
            />
        </div>
    );
};

export default Loader;