import axios from "axios";
import { store } from "@/redux/store";
import { clearAuth } from "@/redux/slices/auth.slice";
import { addToast } from "@/redux/slices/toast.slice";
import { clearLocalSecrets } from "@/utils/indexeddb";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api/backend",
    withCredentials: true
});

// Detect Windows 11 using User-Agent Client Hints
let detectedPlatform = "";
if (typeof navigator !== "undefined" && (navigator as any).userAgentData) {
    (navigator as any).userAgentData.getHighEntropyValues?.(['platformVersion'])?.then((ua: any) => {
        const major = parseInt(ua.platformVersion?.split('.')[0] || "0", 10);
        if (major >= 13) {
            detectedPlatform = "Windows 11";
        }
    }).catch(() => {});
}

// Attach client timezone and platform hints to all outgoing requests
axiosInstance.interceptors.request.use((config) => {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) config.headers["x-client-timezone"] = tz;
        if (detectedPlatform) config.headers["x-client-os"] = detectedPlatform;
    } catch {}
    return config;
});

let last401ToastTime = 0;

axiosInstance.interceptors.response.use(
    (response) => {
        const showToast = response?.data?.show_toast;
        const message = response?.data?.message;

        if (showToast && message) {
            store.dispatch(addToast({ message, type: "success" }));
        }

        return response;
    },
    (error) => {
        const status = error.response?.status;
        const showToast = error?.response?.data?.show_toast;
        const message =
            error?.response?.data?.message || "Something went wrong";

        switch (status) {
            case 400:
                if (showToast) {
                    store.dispatch(addToast({ message, type: "error" }));
                }
                break;
            case 401:
                clearLocalSecrets();
                store.dispatch(clearAuth());
                const now = Date.now();
                if (showToast && now - last401ToastTime > 4000) {
                    last401ToastTime = now;
                    store.dispatch(addToast({ message, type: "error" }));
                }
                break;

            case 403:
                if (showToast) {
                    store.dispatch(addToast({ message, type: "error" }));
                }
                break;

            case 500:
                if (showToast) {
                    store.dispatch(addToast({ message, type: "error" }));
                }
                break;
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;