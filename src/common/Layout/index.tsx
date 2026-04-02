import Navbar from "@/components/Navbar"
import type { PropsWithChildren } from "react"

const Layout = ({ children }: PropsWithChildren) => {
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />
            <main>
                {children}
            </main>
        </div>
    )
}

export default Layout
