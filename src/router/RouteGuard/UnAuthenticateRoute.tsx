import { type PropsWithChildren } from "react"
import { useSelector } from "react-redux"
import { Navigate } from "react-router-dom"

import { getToken } from "@/redux/slices/auth.slice"
import { ROUTES } from "@/constants/routes"


const UnAuthenticateRoute: React.FC<PropsWithChildren> = ({ children }) => {
    const token = useSelector(getToken)

    if (!token) {
        return <>{children}</>
    }
    return <Navigate to={ROUTES.DEFAULT.path} />
}

export default UnAuthenticateRoute
