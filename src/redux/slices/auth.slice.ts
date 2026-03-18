import type { RootState } from "@/redux/store";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthSlice {
    token: string | null
}

const initialState: AuthSlice = {
    token: null
}

const authSlice = createSlice(
    {
        name: 'auth',
        initialState,
        reducers: {
            setToken: (state, action: PayloadAction<string>) => {
                state.token = action.payload
            },

            clearToken: (state) => {
                state.token = null
            }
        }
    }
)

export const { setToken, clearToken } = authSlice.actions

export const getToken = (state: RootState) => state.auth.token

export default authSlice.reducer