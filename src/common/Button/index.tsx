import React from "react"
import Loader from "@/common/Loader"

interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {

    loading?: boolean
    color?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    fullWidth?: boolean
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

    const colorClasses = `
    bg-${color}-600
    hover:bg-${color}-700
    text-white
  `

    return (
        <button
            disabled={isDisabled}
            className={`
        inline-flex items-center justify-center gap-2
        px-4 py-2 rounded-lg font-medium transition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${colorClasses}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
            {...props}
        >

            {loading && (
                <Loader size="sm" />
            )}

            {!loading && leftIcon}

            {children}

            {!loading && rightIcon}

        </button>
    )
}

export default Button