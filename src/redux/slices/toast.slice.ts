import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastState {
    toasts: Toast[];
}

const initialState: ToastState = {
    toasts: [],
};

const toastSlice = createSlice({
    name: "toast",
    initialState,
    reducers: {
        addToast: (state, action: PayloadAction<Omit<Toast, "id">>) => {
            state.toasts.push({
                ...action.payload,
                id: crypto.randomUUID(),
                duration: action.payload.duration ?? 4000,
            });
        },
        removeToast: (state, action: PayloadAction<string>) => {
            state.toasts = state.toasts.filter(t => t.id !== action.payload);
        },
    },
});

export const { addToast, removeToast } = toastSlice.actions;
export const getToasts = (state: RootState) => state.toast.toasts;
export default toastSlice.reducer;