import { useEffect, useState, type JSX } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getToasts, removeToast, type Toast, type ToastType } from "@/redux/slices/toast.slice";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const Icons: Record<ToastType, JSX.Element> = {
    success: <CheckCircle2 size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-destructive" />,
    warning: <AlertTriangle size={18} className="text-yellow-500" />,
    info: <Info size={18} className="text-primary" />,
};

const ToastItem = ({ toast }: { toast: Toast }) => {
    const dispatch = useDispatch();
    const [isLeaving, setIsLeaving] = useState(false);

    const handleDismiss = () => {
        setIsLeaving(true);
        setTimeout(() => {
            dispatch(removeToast(toast.id));
        }, 300);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            handleDismiss();
        }, toast.duration || 4000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration]);

    const typeStyles: Record<ToastType, string> = {
        success: "border-green-500/20 bg-green-500/5 dark:bg-green-500/10",
        error: "border-destructive/20 bg-destructive/5 dark:bg-destructive/10",
        warning: "border-yellow-500/20 bg-yellow-500/5 dark:bg-yellow-500/10",
        info: "border-primary/20 bg-primary/5 dark:bg-primary/10",
    };

    return (
        <div
            className={`
                group relative flex w-full max-w-[calc(100vw-32px)] sm:w-[380px] 
                items-center gap-3 overflow-hidden rounded-xl border p-4 
                shadow-lg backdrop-blur-md transition-all duration-300
                ${typeStyles[toast.type]}
                ${isLeaving ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
                animate-in slide-in-from-right-full
            `}
            role="alert"
        >
            <div className="flex-shrink-0">
                {Icons[toast.type]}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-relaxed">
                    {toast.message}
                </p>
            </div>

            <button
                onClick={handleDismiss}
                className="flex-shrink-0 rounded-lg p-1 text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-colors"
            >
                <X size={16} />
            </button>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-muted/20">
                <div 
                    className={`h-full transition-all duration-[4000ms] ease-linear
                        ${toast.type === 'success' ? 'bg-green-500' : ''}
                        ${toast.type === 'error' ? 'bg-destructive' : ''}
                        ${toast.type === 'warning' ? 'bg-yellow-500' : ''}
                        ${toast.type === 'info' ? 'bg-primary' : ''}
                    `}
                    style={{ 
                        animation: `shrink ${toast.duration || 4000}ms linear forwards` 
                    }}
                />
            </div>
        </div>
    );
};

const ToastContainer = () => {
    const toasts = useSelector(getToasts);

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] flex flex-col items-center gap-3 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
            <style>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
};

export default ToastContainer;
