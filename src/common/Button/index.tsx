import React from "react"
import Loader from "@/common/Loader"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean
    color?: string          // ← keep as string, no breaking change
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    fullWidth?: boolean
}

const colorClasses: Record<string, string> = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-white",
    green: "bg-green-600 hover:bg-green-700 text-white",
    gray: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    orange: "bg-orange-500 hover:bg-orange-600 text-white",
    purple: "bg-purple-600 hover:bg-purple-700 text-white",
}

const Button: React.FC<ButtonProps> = ({
    children,
    loading = false,
    color = "blue",
    leftIcon,
    rightIcon,
    fullWidth,
    disabled,
    className = "",
    ...props
}) => {
    const isDisabled = disabled || loading
    const classes = colorClasses[color] ?? colorClasses.blue  // ← fallback to blue

    return (
        <button
            disabled={isDisabled}
            className={`
                inline-flex items-center justify-center gap-2
                px-4 py-2 rounded-lg font-medium transition
                disabled:opacity-50 disabled:cursor-not-allowed
                ${classes}
                ${fullWidth ? "w-full" : ""}
                ${className}
            `}
            {...props}
        >
            {loading && <Loader size="sm" />}
            {!loading && leftIcon}
            {children}
            {!loading && rightIcon}
        </button>
    )
}

export default Button