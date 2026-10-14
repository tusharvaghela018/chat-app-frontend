import axios from "axios";
import { store } from "@/redux/store";
import { clearAuth } from "@/redux/slices/auth.slice";
import { addToast } from "@/redux/slices/toast.slice";
import { clearLocalSecrets } from "@/utils/indexeddb";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
});

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
        const showToast = error?.response?.data?.show_toast
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
                if (showToast) {
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