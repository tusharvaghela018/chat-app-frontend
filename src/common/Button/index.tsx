import React from "react"
import Loader from "@/common/Loader"
import { useSelector } from "react-redux"
import type { RootState } from "@/redux/store"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'
    size?: 'sm' | 'md' | 'lg' | 'icon'
    color?: string          // ← keep as string for backward compatibility
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    fullWidth?: boolean
}

const Button: React.FC<ButtonProps> = ({
    children,
    loading: localLoading = false,
    variant = 'primary',
    size = 'md',
    color,
    leftIcon,
    rightIcon,
    fullWidth,
    disabled,
    className = "",
    ...props
}) => {
    const isGlobalLoading = useSelector((state: RootState) => state.loading.isLoading)
    const loading = localLoading || isGlobalLoading
    const isDisabled = disabled || loading

    const variants = {
        primary: "bg-primary text-primary-foreground hover:opacity-90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary hover:underline h-auto p-0",
    }

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-8 text-lg",
        icon: "h-10 w-10",
    }

    // Maintain backward compatibility for color prop
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-600 hover:bg-blue-700 text-white",
        red: "bg-red-600 hover:bg-red-700 text-white",
        yellow: "bg-yellow-500 hover:bg-yellow-600 text-white",
        green: "bg-green-600 hover:bg-green-700 text-white",
        gray: "bg-gray-200 hover:bg-gray-300 text-gray-800",
        orange: "bg-orange-500 hover:bg-orange-600 text-white",
        purple: "bg-purple-600 hover:bg-purple-700 text-white",
    }

    const classes = color ? (colorClasses[color] ?? colorClasses.blue) : variants[variant]

    return (
        <button
            disabled={isDisabled}
            className={`
                relative inline-flex items-center justify-center gap-2
                whitespace-nowrap rounded-lg font-medium ring-offset-background transition-all
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
                ${classes}
                ${sizes[size]}
                ${fullWidth ? "w-full" : ""}
                ${className}
            `}
            {...props}
        >
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-lg">
                    <Loader size="sm" />
                </div>
            )}
            
            <span className={`flex items-center gap-2 transition-opacity duration-200 ${loading ? "opacity-0" : "opacity-100"}`}>
                {!loading && leftIcon}
                {children}
                {!loading && rightIcon}
            </span>
        </button>
    )
}

export default Button