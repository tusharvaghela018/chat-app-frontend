import { type PropsWithChildren, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"

import { ROUTES } from "@/constants/routes"
import { getIsAuthenticated, getUser, setUser } from "@/redux/slices/auth.slice"
import { useGetApi } from "@/hooks/api"
import type { IUser } from "@/types"

import Loader from "@/common/Loader"
import { CallProvider } from "@/context/CallContext"
import CallModal from "@/components/call/CallModal"
import FloatingCallWidget from "@/components/call/FloatingCallWidget"

interface MeResponse {
    user: IUser
}

const AuthenticateRoute: React.FC<PropsWithChildren> = ({ children }) => {
    const user = useSelector(getUser)
    const isAuthenticated = useSelector(getIsAuthenticated)
    const dispatch = useDispatch()

    const { data: meData, isSuccess, isLoading } = useGetApi<MeResponse>(
        "/auth/me",
        undefined,
        {
            queryKey: 'get-me',
            enabled: !user, // Fetch if NO user data in redux
            staleTime: 0,
            retry: false,
        }
    )

    useEffect(() => {
        if (isSuccess && meData?.data?.user) {
            const { id, name, username, email, avatar, is_online, public_key, encrypted_vault, vault_salt } = meData.data.user
            dispatch(setUser({
                id: Number(id),
                name: String(name),
                username: String(username),
                email: String(email),
                avatar: String(avatar),
                is_online: is_online || false,
                public_key,
                encrypted_vault,
                vault_salt
            }))
        }
    }, [isSuccess, meData, dispatch])

    if (!user && isLoading) {
        return <Loader fullScreen size="lg" />
    }

    if (!isAuthenticated && !user) {
        return <Navigate to={ROUTES.LOGIN.path} replace />
    }

    return (
        <CallProvider>
            {children}
            <CallModal />
            <FloatingCallWidget />
        </CallProvider>
    )
}

export default AuthenticateRoute
