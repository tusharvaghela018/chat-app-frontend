import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

//import lazy-loading elements
const Login = lazy(() => import("@/pages/auth/login"))
const Register = lazy(() => import("@/pages/auth/register"))
const Home = lazy(() => import("@/pages/home"))
const Dashboard = lazy(() => import("@/pages/dashboard"))
const GoogleCallback = lazy(() => import('@/pages/auth/callback'))
const GoogleError = lazy(() => import('@/pages/auth/error'))
const ChatPage = lazy(() => import('@/pages/chat'))
const JoinGroupPage = lazy(() => import('@/pages/joinGroup'))
const ResetPassword = lazy(() => import('@/pages/auth/reset-password'))

export type RoutesType = {
    [key in 'HOME' | "LOGIN" | "REGISTER" | "DASHBOARD" | "DEFAULT" | "GOOGLE_CALLBACK" | 'GOOGLE_ERROR' | 'CHAT' | 'JOIN_GROUP_PAGE' | 'RESET_PASSWORD']: {
        path: string
        routeType: "public" | "authenticated" | "un-authenticated",
        element: RouteObject['element']
    }
}

export const ROUTES: RoutesType = {
    HOME: {
        path: "/",
        routeType: "public",
        element: <Home />
    },
    LOGIN: {
        path: "/login",
        routeType: "un-authenticated",
        element: <Login />
    },
    REGISTER: {
        path: "/register",
        routeType: "un-authenticated",
        element: <Register />
    },
    // FORGOT_PASSWORD: {
    //     path: "/forgot-password",
    //     routeType: "un-authenticated",
    //     element: <Login /> // Forgot password is a modal on the login page
    // },
    RESET_PASSWORD: {
        path: "/auth/reset-password",
        routeType: "un-authenticated",
        element: <ResetPassword />
    },
    DASHBOARD: {
        path: '/dashboard',
        routeType: "authenticated",
        element: <Dashboard />
    },
    GOOGLE_CALLBACK: {
        path: "/auth/callback",
        routeType: "public",
        element: <GoogleCallback />
    },
    GOOGLE_ERROR: {
        path: '/auth/error',
        routeType: 'public',
        element: <GoogleError />
    },
    CHAT: {
        path: '/chat',
        routeType: 'authenticated',
        element: <ChatPage />
    },
    JOIN_GROUP_PAGE: {
        path: '/groups/join/:token',
        routeType: 'authenticated',
        element: <JoinGroupPage />
    },
    DEFAULT: {
        path: "/",
        routeType: "public",
        element: <Home />
    }
} as const