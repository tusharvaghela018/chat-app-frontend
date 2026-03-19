import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ShieldCheck, Zap, Lock } from "lucide-react";

import Button from "@/common/Button";
import { getToken } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";

const Home = () => {
    const token = useSelector(getToken);

    return (
        <div className="min-h-screen bg-white flex flex-col">

            {/* Navbar */}
            <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <ShieldCheck size={18} className="text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 text-lg">AuthApp</span>
                </div>
                <div className="flex items-center gap-3">
                    {token ? (
                        <Link to={ROUTES.DASHBOARD.path}>
                            <Button color="blue">Go to Dashboard</Button>
                        </Link>
                    ) : (
                        <>
                            <Link to={ROUTES.LOGIN.path}>
                                <Button color="gray" className="!bg-white !text-gray-700 border border-gray-300 hover:!bg-gray-50">
                                    Sign in
                                </Button>
                            </Link>
                            <Link to={ROUTES.REGISTER.path}>
                                <Button color="blue">Get started</Button>
                            </Link>
                        </>
                    )}
                </div>
            </header>

            {/* Hero */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-24">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mb-6">
                    <Zap size={12} /> JWT + Google OAuth ready
                </span>

                <h1 className="text-5xl font-bold text-gray-900 leading-tight max-w-2xl mb-5">
                    Authentication that just{" "}
                    <span className="text-blue-600">works</span>
                </h1>

                <p className="text-lg text-gray-500 max-w-xl mb-10">
                    Full-stack auth with local credentials and Google OAuth. Built with
                    Node.js, Passport, React, and Redux.
                </p>

                <div className="flex items-center gap-4">
                    <Link to={ROUTES.REGISTER.path}>
                        <Button color="blue" className="px-6 py-2.5 text-base">
                            Create free account
                        </Button>
                    </Link>
                    <Link to={ROUTES.LOGIN.path}>
                        <Button color="gray" className="px-6 py-2.5 text-base !bg-white !text-gray-700 border border-gray-300 hover:!bg-gray-50">
                            Sign in
                        </Button>
                    </Link>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-16">
                    {[
                        { icon: <Lock size={14} />, label: "JWT Auth" },
                        { icon: <ShieldCheck size={14} />, label: "Google OAuth 2.0" },
                        { icon: <Zap size={14} />, label: "Passport.js" },
                        { icon: <ShieldCheck size={14} />, label: "Redux Persist" },
                        { icon: <Zap size={14} />, label: "React Hook Form" },
                    ].map(({ icon, label }) => (
                        <span
                            key={label}
                            className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5"
                        >
                            {icon} {label}
                        </span>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Home;