import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/redux/slices/auth.slice"


const rootReducer = combineReducers(
    {
        auth: authReducer
    }
)

export default rootReducer;