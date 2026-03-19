import axios from "axios";
import { store } from "@/redux/store";
import { clearAuth } from "@/redux/slices/auth.slice";
import { addToast } from "@/redux/slices/toast.slice";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

axiosInstance.interceptors.request.use((config) => {
    const token = store.getState().auth.token;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log("🔥 Interceptor Error:", error);

        const status = error.response?.status;
        const message =
            error?.response?.data?.message || "Something went wrong";

        switch (status) {
            case 401:
                store.dispatch(clearAuth());
                store.dispatch(addToast({ message, type: "error" }));
                break;

            case 403:
                store.dispatch(addToast({ message, type: "error" }));
                break;

            case 500:
                store.dispatch(addToast({ message, type: "error" }));
                break;

            default:
                store.dispatch(addToast({ message, type: "error" }));
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;