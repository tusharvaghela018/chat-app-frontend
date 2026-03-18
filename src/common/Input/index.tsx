import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    register?: UseFormRegisterReturn;
    containerClassName?: string;
    inputClassName?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isPassword?: boolean;
    loading?: boolean;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    register,
    containerClassName = "",
    inputClassName = "",
    leftIcon,
    rightIcon,
    isPassword,
    loading = false,
    disabled,
    type = "text",
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    const isDisabled = disabled || loading;

    return (
        <div className={`flex flex-col gap-1 ${containerClassName}`}>
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            <div className="relative flex items-center">

                {leftIcon && (
                    <span className="absolute left-3 text-gray-400">
                        {leftIcon}
                    </span>
                )}

                <input
                    type={inputType}
                    disabled={isDisabled}
                    {...register}
                    {...props}
                    className={`w-full rounded-lg border px-3 py-2 outline-none transition
          ${leftIcon ? "pl-10" : ""}
          ${isPassword || rightIcon ? "pr-10" : ""}
          ${error ? "border-red-500" : "border-gray-300"}
          ${isDisabled ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}
          focus:border-blue-500
          ${inputClassName}`}
                />

                {isPassword ? (
                    <button
                        type="button"
                        disabled={isDisabled}
                        className="absolute right-3 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                ) : (
                    rightIcon && (
                        <span className="absolute right-3 text-gray-400">
                            {rightIcon}
                        </span>
                    )
                )}

            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default Input;