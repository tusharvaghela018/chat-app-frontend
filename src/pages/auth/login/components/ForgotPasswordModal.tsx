import { useForm } from "react-hook-form";
import { Mail, KeyRound, Loader2 } from "lucide-react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";

import Modal from "@/common/Modal";
import Input from "@/common/Input";
import { usePostApi } from "@/hooks/api";

interface ForgotPasswordForm {
    email: string;
}

const forgotPasswordSchema = yup.object({
    email: yup
        .string()
        .required("Email is required")
        .email("Enter a valid email"),
});

interface ForgotPasswordModalProps {
    open: boolean;
    onClose: () => void;
}

const ForgotPasswordModal = ({ open, onClose }: ForgotPasswordModalProps) => {

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        reset,
    } = useForm<ForgotPasswordForm>({
        resolver: yupResolver(forgotPasswordSchema),
    });

    const { mutate: forgotPassword, isPending } = usePostApi<unknown, ForgotPasswordForm>(
        "/auth/forgot-password",
        {
            onSuccess: (_) => {
                reset();
                onClose();
            },
            onError: (error) => {
                const message = axios.isAxiosError(error)
                    ? error.response?.data?.message || "Failed to send reset link"
                    : "Failed to send reset link";
                setError("email", { message });
            },
        }
    );

    const onSubmit = (data: ForgotPasswordForm) => {
        forgotPassword(data);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const renderFooter = (
        <div className="flex items-center justify-end gap-3 w-full">
            <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
                Cancel
            </button>
            <button
                type="submit"
                form="forgot-password-form"
                disabled={isPending}
                className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
                {isPending ? (
                    <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Sending...</span>
                    </>
                ) : (
                    <span>Send Reset Link</span>
                )}
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Forgot password"
            subtitle="Enter your email to receive recovery instructions."
            icon={<KeyRound size={20} />}
            maxWidth="max-w-md"
            footer={renderFooter}
        >
            <form id="forgot-password-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>

                <Input
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    leftIcon={<Mail size={16} />}
                    register={register("email")}
                    error={errors.email?.message}
                />
            </form>
        </Modal>
    );
};

export default ForgotPasswordModal;
