import React from "react";

type LoaderProps = {
    size?: "sm" | "md" | "lg";
};

const sizeMap = {
    sm: "w-1 h-3",
    md: "w-1.5 h-5",
    lg: "w-2 h-6",
};

const WaveLoader: React.FC<LoaderProps> = ({ size = "md" }) => {
    const barSize = sizeMap[size];

    return (
        <div className="flex items-center justify-center py-4">
            <div className="flex items-end gap-1">
                <span className={`${barSize} bg-blue-500 animate-wave`} />
                <span className={`${barSize} bg-blue-500 animate-wave delay-100`} />
                <span className={`${barSize} bg-blue-500 animate-wave delay-200`} />
                <span className={`${barSize} bg-blue-500 animate-wave delay-300`} />
                <span className={`${barSize} bg-blue-500 animate-wave delay-400`} />
            </div>
        </div>
    );
};

export default WaveLoader;