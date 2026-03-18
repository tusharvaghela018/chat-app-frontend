import React from "react";

type LoaderProps = {
    size?: "sm" | "md" | "lg";
    fullScreen?: boolean;
};

const sizeMap = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
};

const ThreeDotLoader: React.FC<LoaderProps> = ({
    size = "md",
    fullScreen = false,
}) => {
    const dotSize = sizeMap[size];

    return (
        <div
            className={`flex items-center justify-center ${fullScreen ? "fixed inset-0 bg-black/20 z-50" : "w-full"
                }`}
        >
            <div className="dot-loader flex gap-2">
                <span className={`${dotSize} bg-blue-500 rounded-full`} />
                <span className={`${dotSize} bg-blue-500 rounded-full`} />
                <span className={`${dotSize} bg-blue-500 rounded-full`} />
            </div>
        </div>
    );
};

export default ThreeDotLoader;