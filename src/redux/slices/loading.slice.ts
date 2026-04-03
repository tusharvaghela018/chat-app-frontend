import { createSlice } from "@reduxjs/toolkit";

interface LoadingState {
    activeRequests: number;
    isLoading: boolean;
}

const initialState: LoadingState = {
    activeRequests: 0,
    isLoading: false,
};

const loadingSlice = createSlice({
    name: "loading",
    initialState,
    reducers: {
        startLoading: (state) => {
            state.activeRequests += 1;
            state.isLoading = true;
        },
        stopLoading: (state) => {
            state.activeRequests = Math.max(0, state.activeRequests - 1);
            state.isLoading = state.activeRequests > 0;
        },
        resetLoading: (state) => {
            state.activeRequests = 0;
            state.isLoading = false;
        },
    },
});

export const { startLoading, stopLoading, resetLoading } = loadingSlice.actions;
export default loadingSlice.reducer;
