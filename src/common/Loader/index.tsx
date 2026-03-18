import React from "react";

type LoaderProps = {
    size?: "sm" | "md" | "lg";
    fullScreen?: boolean;
};

const sizeMap = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4",
};

const Loader: React.FC<LoaderProps> = ({
    size = "md",
    fullScreen = false,
}) => {
    return (
        <div
            className={`flex items-center justify-center ${fullScreen
                ? "fixed inset-0 bg-black/20 z-50"
                : "w-full"
                }`}
        >
            <div
                className={`animate-spin rounded-full border-gray-300 border-t-blue-500 ${sizeMap[size]}`}
            />
        </div>
    );
};

export default Loader;