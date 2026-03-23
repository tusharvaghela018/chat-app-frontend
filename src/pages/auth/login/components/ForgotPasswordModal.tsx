import { useForm } from "react-hook-form";
import { Mail } from "lucide-react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";

import Modal from "@/common/Modal";
import Input from "@/common/Input";
import Button from "@/common/Button";
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

    return (
        <Modal open={open} onClose={onClose} title="Forgot Password">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <p className="text-sm text-gray-500">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    leftIcon={<Mail size={16} />}
                    register={register("email")}
                    error={errors.email?.message}
                />

                <div className="flex justify-end gap-3 mt-2">
                    <Button type="button" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={isPending}>
                        Send Link
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ForgotPasswordModal;
