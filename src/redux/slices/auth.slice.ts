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
}

interface AuthSlice {
    token: string | null
    user: User | null
}

const initialState: AuthSlice = {
    token: null,
    user: null
}

const authSlice = createSlice(
    {
        name: 'auth',
        initialState,
        reducers: {
            setToken: (state, action: PayloadAction<string>) => {
                state.token = action.payload
            },

            setUser: (state, action: PayloadAction<User>) => {
                state.user = action.payload
            },

            clearAuth: (state) => {
                state.token = null
                state.user = null
            }
        }
    }
)

export const { setToken, setUser, clearAuth } = authSlice.actions

export const getToken = (state: RootState) => state.auth.token

export const getUser = (state: RootState) => state.auth.user

export default authSlice.reducer