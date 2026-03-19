import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import Loader from "@/common/Loader";
import { setToken } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import useToast from "@/hooks/toast";

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toast = useToast()

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            dispatch(setToken(token));
            toast.success("Logged in successfully.")
            navigate(ROUTES.DASHBOARD.path, { replace: true });
        } else {
            // No token — something went wrong with Google auth
            navigate(ROUTES.LOGIN.path, { replace: true });
        }
    }, []);

    return <Loader fullScreen size="lg" />;
};

export default GoogleCallback;
