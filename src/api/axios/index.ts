import axios from "axios";
import { store } from "@/redux/store";
import { clearToken } from "@/redux/slices/auth.slice";

const axiosInstance = axios.create(
    {
        baseURL: import.meta.env.VITE_API_URL
    }
)

axiosInstance.interceptors.request.use((config) => {
    const token = store.getState().auth.token

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        switch (status) {
            case 401:
                store.dispatch(clearToken());
                window.location.href = "/login";
                break;

            case 403:
                console.log("Forbidden");
                break;

            case 500:
                console.log("Server Error");
                break;

            default:
                console.log(error.message);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance