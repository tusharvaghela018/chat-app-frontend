import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQueryClient } from "@tanstack/react-query";
import { 
    User as UserIcon, 
    AtSign, 
    Camera, 
    Check, 
    AlertCircle, 
    ArrowLeft,
    ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getUser } from "@/redux/slices/auth.slice";
import { usePatchApi } from "@/hooks/api";
import Button from "@/common/Button";
import Input from "@/common/Input";
import type { IUser } from "@/types";
import { ROUTES } from "@/constants/routes";

const profileSchema = yup.object({
    name: yup.string().required("Name is required").min(2, "Name too short"),
    username: yup.string()
        .required("Username is required")
        .min(3, "Username too short")
        .matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

type ProfileForm = yup.InferType<typeof profileSchema>;

const ProfilePage = () => {
    const user = useSelector(getUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
                }
            }
        });
    };

    const initials = user?.name 
        ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    return (
        <div className="min-h-[calc(100-64px)] bg-background text-foreground pb-20 pt-10">
            <main className="mx-auto max-w-2xl px-4">
                <div className="flex flex-col gap-6 mb-8">
                    <button 
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
                    >
                        <div className="p-2 rounded-xl bg-muted group-hover:bg-accent transition-colors">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="text-sm font-bold">Go Back</span>
                    </button>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                        <p className="text-muted-foreground">Manage your account details and public identity.</p>
                    </div>
                </div>

                <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                    <div className="p-8 space-y-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl ring-4 ring-background">
                                    {avatarPreview ? (
                                        <img 
                                            src={avatarPreview} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Camera size={20} />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                />
                            </div>
                            <div className="text-center">
                                <h2 className="font-bold text-xl">{user?.name}</h2>
                                <p className="text-sm text-muted-foreground italic">@{user?.username}</p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <Input 
                                    label="Full Name"
                                    placeholder="Your full name"
                                    leftIcon={<UserIcon size={18} />}
                                    register={register("name")}
                                    error={errors.name?.message}
                                />
                                <Input 
                                    label="Username"
                                    placeholder="unique_username"
                                    leftIcon={<AtSign size={18} />}
                                    register={register("username")}
                                    error={errors.username?.message}
                                />
                                <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-2">
                                    <div className="flex items-center gap-2 text-primary">
                                        <ShieldCheck size={16} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Account Security</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Your email <span className="text-foreground font-medium">{user?.email}</span> is used for account recovery and cannot be changed here.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button 
                                    type="submit" 
                                    fullWidth 
                                    loading={isPending}
                                    disabled={!isDirty && !selectedFile}
                                    className="rounded-2xl h-12 text-sm font-bold shadow-lg shadow-primary/20"
                                >
                                    Save Changes
                                </Button>
                                {isDirty || selectedFile ? (
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        fullWidth
                                        onClick={() => {
                                            reset();
                                            setAvatarPreview(user?.avatar || null);
                                            setSelectedFile(null);
                                        }}
                                        className="text-xs font-bold"
                                    >
                                        Discard Changes
                                    </Button>
                                ) : null}
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
