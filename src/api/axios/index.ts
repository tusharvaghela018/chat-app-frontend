import axios from "axios";
import { store } from "@/redux/store";
import { clearAuth } from "@/redux/slices/auth.slice";
import { addToast } from "@/redux/slices/toast.slice";
import { startLoading, stopLoading } from "@/redux/slices/loading.slice";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

axiosInstance.interceptors.request.use((config) => {
    store.dispatch(startLoading());
    const token = store.getState().auth.token;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

axiosInstance.interceptors.response.use(
    (response) => {
        store.dispatch(stopLoading());
        const showToast = response?.data?.show_toast;
        const message = response?.data?.message;

        if (showToast && message) {
            store.dispatch(addToast({ message, type: "success" }));
        }

        return response;
    },
    (error) => {
        store.dispatch(stopLoading());

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