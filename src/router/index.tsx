import { Suspense } from "react";
import { createBrowserRouter, RouterProvider, type RouteObject, Outlet } from "react-router-dom";
import Layout from "@/common/Layout";
import { ROUTES } from "@/constants/routes";
import AuthenticateRoute from "@/router/RouteGuard/AuthenticateRoute";
import UnAuthenticateRoute from "@/router/RouteGuard/UnAuthenticateRoute";
import RouteError from "@/common/RouteError";
import PulseLoader from "@/common/Loader/PulseLoader";
import E2EEInitializer from "@/common/E2EEInitializer";

const applySuspense = (routes: RouteObject[]) => {
    return routes.map(route => {
        return {
            ...route,
            element: <Suspense fallback={<PulseLoader fullScreen size="lg" />}>{route.element}</Suspense>
        }
    })
}

export const RoutesArray: RouteObject[] = applySuspense([...Object.keys(ROUTES).map((key) => {
    const route = ROUTES[key as keyof typeof ROUTES];
    const routeObj: RouteObject = {
        path: route.path,
        element: route.element
    }

    if (route.routeType === "authenticated") {
        routeObj['element'] = (
            <AuthenticateRoute>
                <Layout>
                    {route.element}
                </Layout>
            </AuthenticateRoute>)
    } else if (route.routeType === "un-authenticated") {
        routeObj['element'] = (
            <UnAuthenticateRoute>
                {route.element}
            </UnAuthenticateRoute>)
    }

    return routeObj
})])


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
        children: RoutesArray
    }
])

const Routes = () => <RouterProvider router={allRoutes} />

export default Routes
