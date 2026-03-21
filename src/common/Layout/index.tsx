import Navbar from "@/components/Navbar"
import type { PropsWithChildren } from "react"

const Layout = ({ children }: PropsWithChildren) => {
    return (
        <div>
            <Navbar />
            {children}
        </div>
    )
}

export default Layout
