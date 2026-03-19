import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import Loader from "@/common/Loader";
import { setToken } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            dispatch(setToken(token));
            navigate(ROUTES.DASHBOARD.path, { replace: true });
        } else {
            // No token — something went wrong with Google auth
            navigate(ROUTES.LOGIN.path, { replace: true });
        }
    }, []);

    return <Loader fullScreen size="lg" />;
};

export default GoogleCallback;
