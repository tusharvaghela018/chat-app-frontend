import { useDispatch } from "react-redux";
import { addToast, type ToastType } from "@/redux/slices/toast.slice";

const useToast = () => {
    const dispatch = useDispatch();

    const toast = (message: string, type: ToastType = "info", duration?: number) => {
        dispatch(addToast({ message, type, duration }));
    };

    return {
        success: (message: string, duration?: number) => toast(message, "success", duration),
        error: (message: string, duration?: number) => toast(message, "error", duration),
        warning: (message: string, duration?: number) => toast(message, "warning", duration),
        info: (message: string, duration?: number) => toast(message, "info", duration),
    };
};

export default useToast;