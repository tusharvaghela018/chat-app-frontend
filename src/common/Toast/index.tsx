import { useEffect, useRef, useState, type JSX } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getToasts, removeToast, type Toast, type ToastType } from "@/redux/slices/toast.slice";

// ─── Icons (inline SVG — no extra imports needed) ─────────────────────────────

const Icons: Record<ToastType, JSX.Element> = {
    success: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeOpacity="0.3" />
            <path d="M4.5 8L7 10.5L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    error: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeOpacity="0.3" />
            <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    warning: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14.5 13.5H1.5L8 2Z" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
            <path d="M8 6.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.75" fill="currentColor" />
        </svg>
    ),
    info: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeOpacity="0.3" />
            <path d="M8 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="5" r="0.75" fill="currentColor" />
        </svg>
    ),
};

// ─── Per-type design tokens ───────────────────────────────────────────────────

const TOKENS: Record<ToastType, {
    glow: string;
    accent: string;
    bar: string;
    label: string;
    dot: string;
}> = {
    success: {
        glow: "rgba(74,222,128,0.12)",
        accent: "#4ade80",
        bar: "linear-gradient(90deg, #4ade80, #22c55e)",
        label: "Success",
        dot: "#4ade80",
    },
    error: {
        glow: "rgba(248,113,113,0.12)",
        accent: "#f87171",
        bar: "linear-gradient(90deg, #f87171, #ef4444)",
        label: "Error",
        dot: "#f87171",
    },
    warning: {
        glow: "rgba(251,191,36,0.12)",
        accent: "#fbbf24",
        bar: "linear-gradient(90deg, #fbbf24, #f59e0b)",
        label: "Warning",
        dot: "#fbbf24",
    },
    info: {
        glow: "rgba(96,165,250,0.12)",
        accent: "#60a5fa",
        bar: "linear-gradient(90deg, #60a5fa, #3b82f6)",
        label: "Info",
        dot: "#60a5fa",
    },
};

// ─── Single Toast Item ────────────────────────────────────────────────────────

const ToastItem = ({ toast, index }: { toast: Toast; index: number }) => {
    const dispatch = useDispatch();
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [paused, setPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const startRef = useRef<number>(Date.now());
    const remainingRef = useRef<number>(toast.duration ?? 4000);

    const tokens = TOKENS[toast.type];

    const dismiss = () => {
        if (leaving) return;
        setLeaving(true);
        clearTimeout(timerRef.current);
        setTimeout(() => dispatch(removeToast(toast.id)), 400);
    };

    const startTimer = () => {
        startRef.current = Date.now();
        timerRef.current = setTimeout(dismiss, remainingRef.current);
    };

    const pauseTimer = () => {
        clearTimeout(timerRef.current);
        remainingRef.current -= Date.now() - startRef.current;
        setPaused(true);
    };

    const resumeTimer = () => {
        setPaused(false);
        startTimer();
    };

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 20 + index * 60);
        startTimer();
        return () => {
            clearTimeout(t);
            clearTimeout(timerRef.current);
        };
    }, []);

    const enterStyle = visible && !leaving;

    return (
        <div
            onMouseEnter={pauseTimer}
            onMouseLeave={resumeTimer}
            onClick={dismiss}
            style={{
                // Layout
                position: "relative",
                width: "320px",
                padding: "14px 16px 18px",
                borderRadius: "14px",
                overflow: "hidden",
                cursor: "pointer",
                userSelect: "none",

                // Glass dark bg
                background: "rgba(15, 15, 20, 0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",

                // Border with accent glow
                border: `1px solid rgba(255,255,255,0.08)`,
                boxShadow: `
                    0 0 0 1px ${tokens.glow},
                    0 8px 32px rgba(0,0,0,0.4),
                    0 2px 8px rgba(0,0,0,0.3),
                    inset 0 1px 0 rgba(255,255,255,0.05)
                `,

                // Left accent line
                borderLeft: `2px solid ${tokens.accent}`,

                // Animation
                transition: "all 0.4s cubic-bezier(0.34, 1.4, 0.64, 1)",
                opacity: enterStyle ? 1 : 0,
                transform: enterStyle
                    ? "translateX(0) scale(1)"
                    : leaving
                        ? "translateX(110%) scale(0.9)"
                        : "translateX(110%) scale(0.85)",
            }}
        >
            {/* Glow background blob */}
            <div style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: tokens.glow,
                filter: "blur(20px)",
                pointerEvents: "none",
            }} />

            {/* Top row — icon + label + close */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "5px",
            }}>
                {/* Dot indicator */}
                <span style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: tokens.dot,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${tokens.dot}`,
                }} />

                {/* Icon */}
                <span style={{ color: tokens.accent, flexShrink: 0, display: "flex" }}>
                    {Icons[toast.type]}
                </span>

                {/* Label */}
                <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: tokens.accent,
                    flex: 1,
                }}>
                    {tokens.label}
                </span>

                {/* Close button */}
                <button
                    onClick={(e) => { e.stopPropagation(); dismiss(); }}
                    style={{
                        background: "none",
                        border: "none",
                        padding: "2px",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "4px",
                        transition: "color 0.15s",
                        lineHeight: 1,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {/* Message */}
            <p style={{
                margin: "0 0 0 14px",
                fontSize: "13px",
                lineHeight: "1.55",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 400,
                wordBreak: "break-word",
            }}>
                {toast.message}
            </p>

            {/* Progress bar track */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "rgba(255,255,255,0.06)",
            }}>
                <div style={{
                    height: "100%",
                    background: tokens.bar,
                    transformOrigin: "left",
                    animation: paused
                        ? "none"
                        : `toast-shrink ${remainingRef.current}ms linear forwards`,
                    borderRadius: "0 1px 1px 0",
                }} />
            </div>
        </div>
    );
};

// ─── Toast Container ──────────────────────────────────────────────────────────

const ToastContainer = () => {
    const toasts = useSelector(getToasts);

    return (
        <>
            <style>{`
                @keyframes toast-shrink {
                    from { transform: scaleX(1); }
                    to   { transform: scaleX(0); }
                }
            `}</style>

            {/* Bottom-right fixed container */}
            <div style={{
                position: "fixed",
                bottom: "24px",
                right: "24px",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column-reverse",
                gap: "10px",
                alignItems: "flex-end",
                pointerEvents: "none",
            }}>
                {toasts.map((toast, index) => (
                    <div key={toast.id} style={{ pointerEvents: "auto" }}>
                        <ToastItem toast={toast} index={index} />
                    </div>
                ))}
            </div>
        </>
    );
};

export default ToastContainer;