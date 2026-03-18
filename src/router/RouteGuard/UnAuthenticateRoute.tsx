import { Suspense, type PropsWithChildren } from "react"
import { useSelector } from "react-redux"
import { Navigate } from "react-router-dom"

import { getToken } from "@/redux/slices/auth.slice"
import { ROUTES } from "@/constants/routes"
import PulseLoader from "@/common/Loader/PulseLoader"


const UnAuthenticateRoute: React.FC<PropsWithChildren> = ({ children }) => {
    const token = useSelector(getToken)

    if (!token) {
        return <Suspense fallback={<PulseLoader fullScreen size="lg" />}>{children}</Suspense>
    }
    return <Navigate to={ROUTES.DEFAULT.path} />
}

export default UnAuthenticateRoute
