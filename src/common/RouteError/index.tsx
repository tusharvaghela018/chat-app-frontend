import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

export default function RouteError() {
    const error = useRouteError();

    let message = "Something went wrong";

    if (isRouteErrorResponse(error)) {
        message = error.statusText || "Page not found";
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
            <h1 className="text-4xl font-bold text-gray-800">Oops!</h1>

            <p className="mt-3 text-gray-500">{message}</p>

            <Link
                to="/"
                className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
                Go Home
            </Link>
        </div>
    );
}