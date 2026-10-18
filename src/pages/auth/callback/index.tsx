import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import Loader from "@/common/Loader";
import { setUser } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import useToast from "@/hooks/toast";
import axiosInstance from "@/api/axios";

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

    useEffect(() => {
        if (requires2FA) return;

        const authenticate = async () => {
            try {
                if (token) {
                    // Exchange URL ticket to set first-party httpOnly cookie via proxy
                    const res = await axiosInstance.post("/auth/exchange", { token });
                    const user = res.data?.data?.user;
                    if (user) {
                        dispatch(setUser(user));
                        toast.success("Logged in successfully.");
                        navigate(ROUTES.CHAT.path, { replace: true });
                        return;
                    }
                }

                // If no token param, fetch /auth/me directly
                const meRes = await axiosInstance.get("/auth/me");
                const user = meRes.data?.data?.user;
                if (user) {
                    dispatch(setUser(user));
                    toast.success("Logged in successfully.");
                    navigate(ROUTES.CHAT.path, { replace: true });
                } else {
                    navigate(ROUTES.LOGIN.path, { replace: true });
                }
            } catch {
                navigate(ROUTES.LOGIN.path, { replace: true });
            }
        };

        authenticate();
    }, [token, requires2FA]);

    return <Loader fullScreen size="lg" />;
};

export default GoogleCallback;