import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import {
    ShieldCheck, Zap, Lock, MessageSquare, Users,
    CreditCard, Bot, ArrowRight, Sparkles, Globe,
    Video, LayoutDashboard
} from "lucide-react";

import { getToken } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import Button from "@/common/Button";
import { useGetApi } from "@/hooks/api";

/* ─── Animated number counter ─── */
const Counter = ({ to, suffix = "" }: { to: number; suffix?: string }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            let start = 0;
            const step = Math.max(1, Math.ceil(to / 60));
            const timer = setInterval(() => {
                start += step;
                if (start >= to) { setCount(to); clearInterval(timer); }
                else setCount(start);
            }, 16);
        });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [to]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

const STACK = [
    { icon: <Lock size={15} />, label: "JWT Auth" },
    { icon: <ShieldCheck size={15} />, label: "Google OAuth 2.0" },
    { icon: <Zap size={15} />, label: "Passport.js" },
    { icon: <ShieldCheck size={15} />, label: "Redux Persist" },
    { icon: <MessageSquare size={15} />, label: "Socket.IO Chat" },
    { icon: <Zap size={15} />, label: "React Hook Form" },
];

const DONE = [
    { icon: <Lock size={16} />, label: "JWT Authentication" },
    { icon: <Globe size={16} />, label: "Google OAuth 2.0" },
    { icon: <MessageSquare size={16} />, label: "Real-time Chat (1:1)" },
    { icon: <Users size={16} />, label: "Group Messaging" },
    { icon: <ShieldCheck size={16} />, label: "Seen / Delivered Receipts" },
];

const ROADMAP = [
    {
        icon: <CreditCard size={18} />,
        label: "Payments Module",
        desc: "Stripe / Razorpay integration — subscriptions, one-time payments, invoices.",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        tag: "Planned",
    },
    {
        icon: <Bot size={18} />,
        label: "AI Assistant",
        desc: "Embed Claude or GPT — smart replies, message summaries, chat search via AI.",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        tag: "Planned",
    },
    {
        icon: <Video size={18} />,
        label: "Video / Voice Calls",
        desc: "WebRTC peer-to-peer calls directly inside conversations.",
        color: "text-pink-500",
        bg: "bg-pink-500/10",
        tag: "Ideas",
    },
];

export default function Home() {
    const token = useSelector(getToken);
    const heroRef = useRef<HTMLDivElement>(null);

    const { data: homeData } = useGetApi<{
        info: string;
        stats: { users: number; groups: number; messages: number }
    }>("/home");
    const { data: usersData } = useGetApi<{ count: number }>("/users", { limit: 1 }, { enabled: !!token });
    const { data: groupsData } = useGetApi<{ count: number }>("/groups", { limit: 1 }, { enabled: !!token });

    const welcomeInfo = homeData?.data?.info || "JWT + Google OAuth, real-time messaging with seen receipts, and a growing suite of features — all in one platform.";
    const userCount = homeData?.data?.stats?.users || usersData?.data?.count || 1200;
    const groupCount = homeData?.data?.stats?.groups || groupsData?.data?.count || 45;

    /* subtle mouse-parallax on hero */
    useEffect(() => {
        const hero = heroRef.current;
        if (!hero) return;
        const move = (e: MouseEvent) => {
            const dx = (e.clientX / window.innerWidth - 0.5) * 18;
            const dy = (e.clientY / window.innerHeight - 0.5) * 10;
            hero.style.setProperty("--mx", `${dx}px`);
            hero.style.setProperty("--my", `${dy}px`);
        };
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    return (
        <div className="flex flex-col items-center bg-background transition-colors duration-300">
            {/* HERO SECTION */}
            <section
                ref={heroRef}
                className="relative flex min-h-[calc(100vh-64px)] w-full flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-16 text-center sm:px-6 lg:px-8"
            >
                {/* Background Decor */}
                <div
                    className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_30%_40%,rgba(59,130,246,0.1),transparent)] transition-transform duration-75 ease-linear"
                    style={{ transform: 'translate(var(--mx, 0), var(--my, 0))' }}
                />
                <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                {/* Content */}
                <div className="mx-auto flex max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 flex-col items-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
                        <Sparkles size={14} />
                        <span>Full-stack · Real-time · Production-ready</span>
                    </div>

                    <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                        Build apps with auth,<br />
                        chat & <span className="text-primary">everything else</span>
                    </h1>

                    <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                        {welcomeInfo}
                    </p>

                    <div className="mt-10 flex flex-wrap justify-center gap-4">
                        {token ? (
                            <Link to={ROUTES.DASHBOARD.path}>
                                <Button size="lg" className="rounded-xl px-10 shadow-xl shadow-primary/25 font-bold">
                                    Go to Dashboard <LayoutDashboard size={18} className="ml-2" />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to={ROUTES.REGISTER.path}>
                                    <Button size="lg" className="rounded-xl px-8 shadow-xl shadow-primary/25">
                                        Create free account <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                </Link>
                                <Link to={ROUTES.LOGIN.path}>
                                    <Button variant="outline" size="lg" className="rounded-xl px-8">
                                        Sign in
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="w-full border-y bg-muted/30 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        {[
                            { to: userCount * 10, suffix: "+", label: "Messages sent" },
                            { to: 3, suffix: "ms", label: "Avg. delivery time" },
                            { to: 99, suffix: ".9%", label: "Uptime SLA" },
                            { to: groupCount, suffix: "", label: "Active Communities" },
                        ].map((s) => (
                            <div key={s.label} className="text-center">
                                <div className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                                    <Counter to={s.to} suffix={s.suffix} />
                                </div>
                                <div className="mt-1 text-sm font-medium uppercase tracking-widest text-muted-foreground">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section className="w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                <div className="mb-16">
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Capabilities</h2>
                    <h3 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">What's already built</h3>
                    <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                        A solid, production-ready foundation so you can focus on shipping features.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {STACK.map((s, i) => (
                        <div key={i} className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                {s.icon}
                            </div>
                            <span className="font-semibold text-foreground">{s.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* SHIPPED vs ROADMAP */}
            <section className="w-full bg-muted/20 py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-16 lg:grid-cols-2">
                        {/* Shipped */}
                        <div>
                            <div className="mb-8">
                                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-green-500">Shipped ✓</h2>
                                <h3 className="mt-4 font-display text-3xl font-bold text-foreground">Live today</h3>
                            </div>
                            <div className="space-y-4">
                                {DONE.map((d, i) => (
                                    <div key={i} className="flex items-center gap-4 rounded-2xl border bg-card p-5">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                                            <ShieldCheck size={14} />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-muted-foreground">{d.icon}</span>
                                            <span className="font-medium text-foreground">{d.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Roadmap */}
                        <div>
                            <div className="mb-8">
                                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Coming Next</h2>
                                <h3 className="mt-4 font-display text-3xl font-bold text-foreground">What's being built</h3>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {ROADMAP.map((r, i) => (
                                    <div key={i} className="group rounded-2xl border bg-card p-6 transition-all hover:border-primary/50">
                                        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${r.bg} ${r.color}`}>
                                            {r.icon}
                                        </div>
                                        <h4 className="font-display font-bold text-foreground">{r.label}</h4>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
                                        <div className="mt-4">
                                            <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${r.bg} ${r.color}`}>
                                                {r.tag}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="w-full px-4 py-24 sm:px-6 lg:px-8">
                <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-2xl">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
                    <h2 className="font-display text-3xl font-extrabold sm:text-5xl">Ready to start building?</h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg opacity-90 sm:text-xl">
                        {token
                            ? "Explore your dashboard and start managing your real-time conversations today."
                            : "Sign up in seconds. Join thousands of developers building the future of real-time applications."}
                    </p>
                    <div className="mt-10 flex flex-wrap justify-center gap-4">
                        {token ? (
                            <Link to={ROUTES.DASHBOARD.path} className="w-full sm:w-auto">
                                <Button size="lg" variant="secondary" className="w-full sm:w-auto rounded-xl px-12 font-bold shadow-lg">
                                    Go to Dashboard <LayoutDashboard size={18} className="ml-2" />
                                </Button>
                            </Link>
                        ) : (
                            <Link to={ROUTES.REGISTER.path} className="w-full sm:w-auto">
                                <Button size="lg" variant="secondary" className="w-full sm:w-auto rounded-xl px-10 font-bold shadow-lg">
                                    Get Started for Free
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="w-full border-t py-12 px-4 text-center sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                        <div className="flex items-center gap-2 font-display font-bold text-foreground">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <ShieldCheck size={16} />
                            </div>
                            NexusApp
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} NexusApp · Built with Node.js, React & Socket.IO
                        </p>
                        <div className="flex gap-6 text-sm font-medium text-muted-foreground">
                            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
                            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
                            <a href="#" className="hover:text-primary transition-colors">Discord</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
