import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import Loader from "@/common/Loader";
import { setUser } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import useToast from "@/hooks/toast";
import { useGetApi } from "@/hooks/api";
import type { IUser } from "@/types";

interface MeResponse {
    user: IUser
}

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toast = useToast();

    const token = searchParams.get("token");
    const requires2FA = searchParams.get("requires_2fa") === "true";

    // ── if 2FA is required, redirect to verify page immediately ──────────
    useEffect(() => {
        if (token && requires2FA) {
            navigate(`${ROUTES.VERIFY_2FA.path}?token=${token}`, { replace: true });
        }
    }, [token, requires2FA]);

    // ── fetch /auth/me — uses the httpOnly cookie automatically ──────────
    const { data: meData, isSuccess, isError } = useGetApi<MeResponse>(
        "/auth/me",
        undefined,
        {
            queryKey: 'get-me',
            enabled: !requires2FA,   // fires when 2FA is not required
            retry: false,            // don't retry on failure — just redirect to login
        }
    )

    // ── on success — store user and redirect ──────────────────────────────
    useEffect(() => {
        if (!isSuccess || !meData?.data) return
        const { id, name, username, email, avatar, is_online, public_key, encrypted_vault, vault_salt } = { ...meData.data.user }
        const userData = {
            id: Number(id),
            name: String(name),
            username: String(username),
            email: String(email),
            avatar: String(avatar),
            is_online: is_online || false,
            public_key,
            encrypted_vault,
            vault_salt
        }
        dispatch(setUser(userData))
        toast.success("Logged in successfully.")
        navigate(ROUTES.CHAT.path, { replace: true })
    }, [isSuccess, meData])

    // ── on error — /me failed, token was bad ──────────────────────────────
    useEffect(() => {
        if (!isError) return
        navigate(ROUTES.LOGIN.path, { replace: true })
    }, [isError])

    return <Loader fullScreen size="lg" />;
};

export default GoogleCallback;