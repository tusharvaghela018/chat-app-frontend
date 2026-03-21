import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import Loader from "@/common/Loader";
import { setToken, setUser } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import useToast from "@/hooks/toast";
import { useGetApi } from "@/hooks/api";

interface IUser {
    user: {
        id: number
        name: string
        avatar?: string
        is_online?: boolean
    }
}

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toast = useToast();

    const token = searchParams.get("token");

    // ── set token immediately so axiosInstance sends it in headers ────────
    if (token) {
        dispatch(setToken(token));
    }

    // ── fetch /auth/me — only runs when token exists ──────────────────────
    const { data: meData, isSuccess, isError } = useGetApi<IUser>(
        "/auth/me",
        undefined,
        {
            enabled: !!token,   // only fires when token is present
            retry: false,       // don't retry on failure — just redirect to login
        }
    )

    useEffect(() => {
        if (!token) {
            navigate(ROUTES.LOGIN.path, { replace: true });
            return;
        }
    }, [token])

    // ── on success — store user and redirect ──────────────────────────────
    useEffect(() => {
        if (!isSuccess || !meData?.data) return
        const { id, name, avatar, is_online } = { ...meData.data.user }
        const userData = {
            id: Number(id),
            name: String(name),
            avatar: String(avatar),
            is_online: is_online || false
        }
        dispatch(setUser(userData))
        toast.success("Logged in successfully.")
        navigate(ROUTES.DASHBOARD.path, { replace: true })
    }, [isSuccess, meData])

    // ── on error — /me failed, token was bad ──────────────────────────────
    useEffect(() => {
        if (!isError) return
        navigate(ROUTES.LOGIN.path, { replace: true })
    }, [isError])

    return <Loader fullScreen size="lg" />;
};

export default GoogleCallback;