import React from "react";

type LoaderProps = {
    size?: "sm" | "md" | "lg";
    fullScreen?: boolean;
};

const sizeMap = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
};

const PulseLoader: React.FC<LoaderProps> = ({
    size = "md",
    fullScreen = true,
}) => {
    const loaderSize = sizeMap[size];

    return (
        <div
            className={`flex items-center justify-center ${fullScreen ? "fixed inset-0 bg-background z-50" : "w-full py-10"
                }`}
        >
            <div className={`relative ${loaderSize}`}>
                <span className="absolute inset-0 rounded-full bg-primary opacity-75 animate-ping"></span>
                <span className="relative block w-full h-full rounded-full bg-primary"></span>
            </div>
        </div>
    );
};

export default PulseLoader;