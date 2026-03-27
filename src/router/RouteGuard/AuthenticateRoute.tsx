import { Suspense, type PropsWithChildren, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"

import PulseLoader from "@/common/Loader/PulseLoader"
import { ROUTES } from "@/constants/routes"
import { getToken, setUser } from "@/redux/slices/auth.slice"
import { useGetApi } from "@/hooks/api"
import type { IUser } from "@/types"

interface MeResponse {
    user: IUser
}

const AuthenticateRoute: React.FC<PropsWithChildren> = ({ children }) => {
    const token = useSelector(getToken)
    const dispatch = useDispatch()

    const { data: meData, isSuccess } = useGetApi<MeResponse>(
        "/auth/me",
        undefined,
        {
            queryKey: 'get-me',
            enabled: !!token,
            staleTime: 5 * 60 * 1000, // 5 minutes
        }
    )

    useEffect(() => {
        if (isSuccess && meData?.data?.user) {
            const { id, name, avatar, is_online } = meData.data.user
            dispatch(setUser({
                id: Number(id),
                name: String(name),
                avatar: String(avatar),
                is_online: is_online || false
            }))
        }
    }, [isSuccess, meData, dispatch])

    if (!token) {
        return <Navigate to={ROUTES.DEFAULT.path} />
    }

    return (
        <Suspense fallback={<PulseLoader fullScreen size="lg" />}>{children}</Suspense>
    )
}

export default AuthenticateRoute
