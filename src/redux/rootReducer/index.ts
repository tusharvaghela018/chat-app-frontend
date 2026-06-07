import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/redux/slices/auth.slice"
import toastReducer from "@/redux/slices/toast.slice"

const rootReducer = combineReducers(
    {
        auth: authReducer,
        toast: toastReducer,
    }
)

export default rootReducer;