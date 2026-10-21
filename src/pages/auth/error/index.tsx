import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Loader from "@/common/Loader";
import { ROUTES } from "@/constants/routes";
import useToast from "@/hooks/toast";

const GoogleError = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        const errorCode = searchParams.get("message");

        // Map backend error codes → user-friendly messages
        const errorMap: Record<string, string> = {
            EMAIL_ALREADY_EXISTS: "You already signed up using email & password.",
            GOOGLE_AUTH_FAILED: "Google authentication failed. Please try again.",
            SERVER_ERROR: "Something went wrong. Please try again later.",
        };

        const message =
            (errorCode && errorMap[errorCode]) ||
            "Login failed. Please try again.";

        if (errorCode) {
            toast.error(message);
        }

        // Redirect to login page
        navigate(ROUTES.LOGIN.path, { replace: true });
    }, []);

    return <Loader fullScreen size="lg" />;
};

export default GoogleError;