import type { RootState } from "@/redux/store";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface User {
    id: number
    name: string
    username: string
    email: string
    is_online: boolean
    avatar: string
    public_key?: string
    encrypted_vault?: string
    vault_salt?: string
    two_factor_enabled?: boolean
}

interface AuthSlice {
    isAuthenticated: boolean
    user: User | null
}

const initialState: AuthSlice = {
    isAuthenticated: false,
    user: null
}

const authSlice = createSlice(
    {
        name: 'auth',
        initialState,
        reducers: {
            setUser: (state, action: PayloadAction<User>) => {
                state.user = action.payload
                state.isAuthenticated = true
            },

            clearAuth: (state) => {
                state.user = null
                state.isAuthenticated = false
            }
        },
        extraReducers: (builder) => {
            builder.addCase("persist/REHYDRATE", (state: any, action: any) => {
                if (action.payload?.auth) {
                    delete action.payload.auth.token;
                }
                if (state && "token" in state) {
                    delete state.token;
                }
            });
        }
    }
)

export const { setUser, clearAuth } = authSlice.actions

export const getUser = (state: RootState) => state.auth.user

export const getIsAuthenticated = (state: RootState) => state.auth.isAuthenticated || !!state.auth.user

// Kept for backward-compatibility if referenced
export const getToken = (_state: RootState) => null

export default authSlice.reducer