import { Suspense, type PropsWithChildren } from "react"
import { Navigate } from "react-router-dom"
import { useSelector } from "react-redux"

import PulseLoader from "@/common/Loader/PulseLoader"
import { ROUTES } from "@/constants/routes"
import { getToken } from "@/redux/slices/auth.slice"

const AuthenticateRoute: React.FC<PropsWithChildren> = ({ children }) => {

    const token = useSelector(getToken)

    if (!token) {
        return <Navigate to={ROUTES.DEFAULT.path} />
    }

    return (
        <Suspense fallback={<PulseLoader fullScreen size="lg" />}>{children}</Suspense>
    )
}

export default AuthenticateRoute
