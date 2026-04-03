import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

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
    loading: localLoading = false,
    disabled,
    type = "text",
    ...props
}) => {
    const isGlobalLoading = useSelector((state: RootState) => state.loading.isLoading);
    const [showPassword, setShowPassword] = useState(false);

    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    const isDisabled = disabled || localLoading || isGlobalLoading;

    return (
        <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
            {label && (
                <label className="text-sm font-semibold text-foreground/80 ml-0.5">
                    {label}
                </label>
            )}

            <div className="relative flex items-center group">

                {leftIcon && (
                    <span className={`absolute left-3 transition-colors ${isDisabled ? "text-muted-foreground/50" : "text-muted-foreground group-focus-within:text-primary"}`}>
                        {leftIcon}
                    </span>
                )}

                <input
                    type={inputType}
                    disabled={isDisabled}
                    {...register}
                    {...props}
                    className={`
                        flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm 
                        text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
                        placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 
                        focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
                        transition-all duration-200
                        ${leftIcon ? "pl-10" : ""}
                        ${isPassword || rightIcon ? "pr-10" : ""}
                        ${error ? "border-destructive ring-destructive/20 focus-visible:ring-destructive" : "focus-visible:ring-primary/20 focus-visible:border-primary"}
                        ${isDisabled ? "bg-muted/30" : "bg-background"}
                        ${inputClassName}
                    `}
                />

                {isPassword ? (
                    <button
                        type="button"
                        disabled={isDisabled}
                        className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                ) : (
                    rightIcon && (
                        <span className="absolute right-3 text-muted-foreground">
                            {rightIcon}
                        </span>
                    )
                )}

            </div>

            {error && <p className="text-xs font-medium text-destructive mt-0.5 ml-0.5">{error}</p>}
        </div>
    );
};

export default Input;