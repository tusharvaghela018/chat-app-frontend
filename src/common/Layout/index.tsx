import Navbar from "@/components/Navbar"
import { Outlet } from "react-router-dom"

const Layout = () => {
    return (
        <div className="h-screen flex flex-col bg-background text-foreground transition-colors duration-300 overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
