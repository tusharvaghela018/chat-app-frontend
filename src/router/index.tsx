import { Suspense } from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Layout from "@/common/Layout";
import { ROUTES } from "@/constants/routes";
import AuthenticateRoute from "@/router/RouteGuard/AuthenticateRoute";
import UnAuthenticateRoute from "@/router/RouteGuard/UnAuthenticateRoute";
import RouteError from "@/common/RouteError";
import PulseLoader from "@/common/Loader/PulseLoader";
import E2EEInitializer from "@/common/E2EEInitializer";

const allRoutes = createBrowserRouter([
    {
        path: "/",
        element: (
            <>
                <E2EEInitializer />
                <Outlet />
            </>
        ),
        errorElement: <RouteError />,
        children: [
            // Public Routes (No Layout)
            {
                path: ROUTES.HOME.path,
                element: <Suspense fallback={<PulseLoader fullScreen size="lg" />}>{ROUTES.HOME.element}</Suspense>
            },
            {
                path: ROUTES.PRIVACY_POLICY.path,
                element: <Suspense fallback={<PulseLoader fullScreen size="lg" />}>{ROUTES.PRIVACY_POLICY.element}</Suspense>
            },
            {
                path: ROUTES.VERIFY_2FA.path,
                element: <Suspense fallback={<PulseLoader fullScreen size="lg" />}>{ROUTES.VERIFY_2FA.element}</Suspense>
            },
            {
                path: ROUTES.GOOGLE_CALLBACK.path,
                element: <Suspense fallback={<PulseLoader fullScreen size="lg" />}>{ROUTES.GOOGLE_CALLBACK.element}</Suspense>
            },
            {
                path: ROUTES.GOOGLE_ERROR.path,
                element: <Suspense fallback={<PulseLoader fullScreen size="lg" />}>{ROUTES.GOOGLE_ERROR.element}</Suspense>
            },
            {
                path: ROUTES.RESET_PASSWORD.path,
                element: <Suspense fallback={<PulseLoader fullScreen size="lg" />}>{ROUTES.RESET_PASSWORD.element}</Suspense>
            },

            // Un-Authenticated Routes (Login/Register)
            {
                element: <UnAuthenticateRoute><Outlet /></UnAuthenticateRoute>,
                children: [
                    {
                        path: ROUTES.LOGIN.path,
                        element: <Suspense fallback={<PulseLoader fullScreen size="lg" />}>{ROUTES.LOGIN.element}</Suspense>
                    },
                    {
                        path: ROUTES.REGISTER.path,
                        element: <Suspense fallback={<PulseLoader fullScreen size="lg" />}>{ROUTES.REGISTER.element}</Suspense>
                    }
                ]
            },

            // Authenticated Routes (With Persistent Layout)
            {
                element: (
                    <AuthenticateRoute>
                        <Layout />
                    </AuthenticateRoute>
                ),
                children: [
                    {
                        path: ROUTES.CHAT.path,
                        element: <Suspense fallback={<PulseLoader size="md" fullScreen={false} />}>{ROUTES.CHAT.element}</Suspense>
                    },
                    {
                        path: ROUTES.SETTINGS.path,
                        element: <Suspense fallback={<PulseLoader size="md" fullScreen={false} />}>{ROUTES.SETTINGS.element}</Suspense>
                    },
                    {
                        path: ROUTES.PROFILE.path,
                        element: <Suspense fallback={<PulseLoader size="md" fullScreen={false} />}>{ROUTES.PROFILE.element}</Suspense>
                    },
                    {
                        path: ROUTES.JOIN_GROUP_PAGE.path,
                        element: <Suspense fallback={<PulseLoader size="md" fullScreen={false} />}>{ROUTES.JOIN_GROUP_PAGE.element}</Suspense>
                    }
                ]
            }
        ]
    }
])

const Routes = () => <RouterProvider router={allRoutes} />

export default Routes
