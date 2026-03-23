import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";

import Input from "@/common/Input";
import Button from "@/common/Button";
import { usePostApi } from "@/hooks/api";
import { ROUTES } from "@/constants/routes";

const resetPasswordSchema = yup.object({
    password: yup
        .string()
        .required("Password is required")
        .min(6, "Minimum 6 characters"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "Passwords must match")
        .required("Confirm password is required"),
});

type ResetPasswordForm = yup.InferType<typeof resetPasswordSchema>;

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<ResetPasswordForm>({
        resolver: yupResolver(resetPasswordSchema),
    });

    const { mutate: resetPassword, isPending } = usePostApi<unknown, any>(
        "/auth/reset-password",
        {
            onSuccess: (_) => {
                navigate(ROUTES.LOGIN.path);
            },
            onError: (error) => {
                const message = axios.isAxiosError(error)
                    ? error.response?.data?.message || "Failed to reset password"
                    : "Failed to reset password";
                setError("root", { message });
            },
        }
    );

    const onSubmit = (data: ResetPasswordForm) => {
        if (!token) {
            return;
        }
        resetPassword({
            token,
            password: data.password,
        });
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Link</h1>
                        <p className="text-gray-500 mb-6">The password reset link is invalid or has expired.</p>
                        <Button onClick={() => navigate(ROUTES.LOGIN.path)} fullWidth>
                            Back to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
                            <Lock size={22} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900">Reset Password</h1>
                        <p className="text-sm text-gray-500 mt-1">Enter your new password below</p>
                    </div>

                    {/* Root error */}
                    {errors.root && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-600">{errors.root.message}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <Input
                            label="New Password"
                            isPassword
                            placeholder="Enter new password"
                            leftIcon={<Lock size={16} />}
                            register={register("password")}
                            error={errors.password?.message}
                        />

                        <Input
                            label="Confirm Password"
                            isPassword
                            placeholder="Confirm your password"
                            leftIcon={<Lock size={16} />}
                            register={register("confirmPassword")}
                            error={errors.confirmPassword?.message}
                        />

                        <Button type="submit" fullWidth loading={isPending} className="mt-2">
                            Reset Password
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
