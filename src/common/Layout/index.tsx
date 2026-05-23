import Navbar from "@/components/Navbar"
import type { PropsWithChildren } from "react"

const Layout = ({ children }: PropsWithChildren) => {
    return (
        <div className="h-screen flex flex-col bg-background text-foreground transition-colors duration-300 overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto custom-scrollbar">
                {children}
            </main>
        </div>
    )
}

export default Layout
