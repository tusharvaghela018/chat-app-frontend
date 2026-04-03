import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/redux/slices/auth.slice"
import toastReducer from "@/redux/slices/toast.slice"
import loadingReducer from "@/redux/slices/loading.slice"

const rootReducer = combineReducers(
    {
        auth: authReducer,
        toast: toastReducer,
        loading: loadingReducer,
    }
)

export default rootReducer;