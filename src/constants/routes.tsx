import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

//import lazy-loading elements
const Login = lazy(() => import("@/pages/auth/login"))
const Register = lazy(() => import("@/pages/auth/register"))
const Home = lazy(() => import("@/pages/home"))
const GoogleCallback = lazy(() => import('@/pages/auth/callback'))
const Settings = lazy(() => import("@/pages/settings"))
const GoogleError = lazy(() => import("@/pages/auth/error"))
const ChatPage = lazy(() => import('@/pages/chat'))
const JoinGroupPage = lazy(() => import('@/pages/joinGroup'))
const ResetPassword = lazy(() => import('@/pages/auth/reset-password'))
const Verify2FA = lazy(() => import('@/pages/auth/verify-2fa'))
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'))
const Profile = lazy(() => import('@/pages/Profile'))

export type RoutesType = {
    [key in 'HOME' | "LOGIN" | "REGISTER" | "DEFAULT" | "GOOGLE_CALLBACK" | 'GOOGLE_ERROR' | 'CHAT' | 'JOIN_GROUP_PAGE' | 'RESET_PASSWORD' | 'VERIFY_2FA' | 'PRIVACY_POLICY' | 'PROFILE' | 'SETTINGS']: {
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
    VERIFY_2FA: {
        path: "/auth/verify-2fa",
        routeType: "public",
        element: <Verify2FA />
    },
    PRIVACY_POLICY: {
        path: "/privacy-policy",
        routeType: "public",
        element: <PrivacyPolicy />
    },
    PROFILE: {
        path: '/profile',
        routeType: "authenticated",
        element: <Profile />
    },
    SETTINGS: {
        path: '/settings',
        routeType: 'authenticated',
        element: <Settings />
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