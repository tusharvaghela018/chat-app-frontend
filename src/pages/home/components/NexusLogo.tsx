import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

interface NexusLogoProps {
    size?: "sm" | "md" | "lg";
    showText?: boolean;
    className?: string;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({
    size = "md",
    showText = true,
    className = ""
}) => {
    const iconSizes = {
        sm: "h-7 w-7 rounded-lg text-xs",
        md: "h-9 w-9 rounded-xl text-sm",
        lg: "h-11 w-11 rounded-2xl text-base"
    };

    const textSizes = {
        sm: "text-lg",
        md: "text-xl",
        lg: "text-2xl"
    };

    return (
        <Link
            to={ROUTES.HOME.path}
            className={`inline-flex items-center gap-2.5 group select-none ${className}`}
        >
            {/* Logo Emblem: Vibrant Violet/Indigo Gradient Squircle with Stylized N */}
            <div
                className={`relative flex items-center justify-center font-black text-white shadow-md shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/40 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 ${iconSizes[size]}`}
            >
                {/* Subtle Inner Glow */}
                <div className="absolute inset-0 rounded-[inherit] bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Stylized N SVG Path */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3/5 w-3/5 drop-shadow-xs"
                >
                    <path
                        d="M6 19V5L18 19V5"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            {/* Brand Text */}
            {showText && (
                <span
                    className={`font-display font-extrabold tracking-tight text-foreground transition-colors ${textSizes[size]}`}
                >
                    Nexus<span className="text-foreground">App</span>
                </span>
            )}
        </Link>
    );
};

export default NexusLogo;
