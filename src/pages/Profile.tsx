import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQueryClient } from "@tanstack/react-query";
import { 
    User as UserIcon, 
    AtSign, 
    Camera, 
    ArrowLeft,
    ShieldCheck,
    CheckCircle2,
    Loader2,
    Copy,
    Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getUser } from "@/redux/slices/auth.slice";
import { usePatchApi } from "@/hooks/api";
import Input from "@/common/Input";
import type { IUser } from "@/types";
import { ROUTES } from "@/constants/routes";
import useToast from "@/hooks/toast";

const profileSchema = yup.object({
    name: yup.string().required("Full name is required").min(2, "Name must be at least 2 characters"),
    username: yup.string()
        .required("Username is required")
        .min(3, "Username must be at least 3 characters")
        .matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

type ProfileForm = yup.InferType<typeof profileSchema>;

const ProfilePage = () => {
    const user = useSelector(getUser);
    const navigate = useNavigate();
    const toast = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [copiedUsername, setCopiedUsername] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset
    } = useForm<ProfileForm>({
        resolver: yupResolver(profileSchema),
        defaultValues: {
            name: user?.name || "",
            username: user?.username || "",
        }
    });

    useEffect(() => {
        if (user) {
            reset({
                name: user.name,
                username: user.username
            });
            setAvatarPreview(user.avatar || null);
        }
    }, [user, reset]);

    const { mutate: updateProfile, isPending } = usePatchApi<IUser>("/users");

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = (data: ProfileForm) => {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("username", data.username);
        if (selectedFile) {
            formData.append("avatar", selectedFile);
        }

        updateProfile({ body: formData as any }, {
            onSuccess: (res) => {
                if (res.success) {
                    queryClient.invalidateQueries({ queryKey: ['get-me'] });
                    setSelectedFile(null);
                    setSavedSuccess(true);
                    toast.success("Profile updated successfully");
                    setTimeout(() => setSavedSuccess(false), 3000);
                }
            }
        });
    };

    const handleCopyUsername = () => {
        if (!user?.username) return;
        navigator.clipboard.writeText(`@${user.username}`);
        setCopiedUsername(true);
        setTimeout(() => setCopiedUsername(false), 2000);
        toast.success("Username copied to clipboard");
    };

    const initials = user?.name 
        ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate(ROUTES.SETTINGS.path);
        }
    };

    return (
        <div className="min-h-full bg-slate-50 dark:bg-[#090b16] text-slate-900 dark:text-slate-100 pb-24 pt-6 sm:pt-8 transition-colors relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

            <main className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6">
                
                {/* Top Navigation & Breadcrumb */}
                <div className="flex flex-col gap-4 mb-6">
                    <button 
                        type="button"
                        onClick={handleBack}
                        className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-800 transition-all shadow-2xs w-fit cursor-pointer"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span>Go Back</span>
                    </button>

                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Profile Settings
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Manage your account details and public identity.
                        </p>
                    </div>
                </div>

                {/* Main Profile Card */}
                <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-purple-500/5 transition-all space-y-8">
                    
                    {/* Avatar & Header Section */}
                    <div className="flex flex-col items-center text-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="relative group">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-600 flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-white shadow-xl shadow-purple-600/30 ring-4 ring-purple-500/10 dark:ring-purple-400/10 transition-transform group-hover:scale-[1.02]">
                                {avatarPreview ? (
                                    <img 
                                        src={avatarPreview} 
                                        alt="Avatar Preview" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    initials
                                )}
                            </div>

                            {/* Camera Action Badge */}
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1.5 -right-1.5 p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg shadow-purple-600/35 hover:scale-110 active:scale-95 transition-all cursor-pointer ring-2 ring-white dark:ring-slate-900"
                                title="Upload new photo"
                            >
                                <Camera size={15} />
                            </button>

                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                {user?.name || "Your Name"}
                            </h2>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopyUsername}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                                    title="Click to copy username"
                                >
                                    <AtSign size={12} className="text-purple-500" />
                                    <span>{user?.username || "username"}</span>
                                    {copiedUsername ? <Check size={12} className="text-emerald-500" /> : <Copy size={11} className="text-slate-400" />}
                                </button>

                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Online</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                                    Full Name
                                </label>
                                <Input 
                                    placeholder="Your full name"
                                    leftIcon={<UserIcon size={16} className="text-slate-400" />}
                                    register={register("name")}
                                    error={errors.name?.message}
                                    inputClassName="!bg-slate-50 dark:!bg-slate-950/60 !border-slate-200 dark:!border-slate-800 focus:!border-purple-500 focus:!ring-purple-500/20 rounded-2xl text-xs sm:text-sm font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-0.5">
                                    Username
                                </label>
                                <Input 
                                    placeholder="unique_username"
                                    leftIcon={<AtSign size={16} className="text-slate-400" />}
                                    register={register("username")}
                                    error={errors.username?.message}
                                    inputClassName="!bg-slate-50 dark:!bg-slate-950/60 !border-slate-200 dark:!border-slate-800 focus:!border-purple-500 focus:!ring-purple-500/20 rounded-2xl text-xs sm:text-sm font-semibold"
                                />
                            </div>

                            {/* Account Security Notice */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                                    <ShieldCheck size={16} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">
                                        Account Security
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Your email <span className="text-slate-900 dark:text-slate-200 font-semibold">{user?.email}</span> is used for account recovery and cannot be changed here.
                                </p>
                            </div>

                            {/* Success Notification */}
                            {savedSuccess && (
                                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                    <span>Profile updated successfully!</span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2.5 pt-2">
                            <button 
                                type="submit" 
                                disabled={isPending || (!isDirty && !selectedFile)}
                                className="w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-600/25 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Saving Changes...</span>
                                    </>
                                ) : (
                                    <span>Save Changes</span>
                                )}
                            </button>

                            {(isDirty || selectedFile) && (
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        reset();
                                        setAvatarPreview(user?.avatar || null);
                                        setSelectedFile(null);
                                    }}
                                    className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer text-center"
                                >
                                    Discard Changes
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
