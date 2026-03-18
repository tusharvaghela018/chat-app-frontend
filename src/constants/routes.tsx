import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

//import lazy-loading elements
const Login = lazy(() => import("@/pages/auth/login"))
const Register = lazy(() => import("@/pages/auth/register"))
const Home = lazy(() => import("@/pages/home"))
const Dashboard = lazy(() => import("@/pages/dashboard"))

export type RoutesType = {
    [key in 'HOME' | "LOGIN" | "REGISTER" | "DASHBOARD" | "DEFAULT"]: {
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
    DASHBOARD: {
        path: '/dashboard',
        routeType: "authenticated",
        element: <Dashboard />
    },
    DEFAULT: {
        path: "/",
        routeType: "public",
        element: <Home />
    }
} as const