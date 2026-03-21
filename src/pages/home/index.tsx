import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import {
    ShieldCheck, Zap, Lock, MessageSquare, Users,
    CreditCard, Bot, ArrowRight, Sparkles, Globe,
    BarChart3, Bell, Video, FileText, Layers
} from "lucide-react";

import { getToken } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";

/* ─── Animated number counter ─── */
const Counter = ({ to, suffix = "" }: { to: number; suffix?: string }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            let start = 0;
            const step = Math.ceil(to / 60);
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

/* ─── Floating particle dot ─── */
const Dot = ({ style }: { style: React.CSSProperties }) => (
    <span className="particle-dot" style={style} />
);

const STACK = [
    { icon: <Lock size={15} />, label: "JWT Auth" },
    { icon: <ShieldCheck size={15} />, label: "Google OAuth 2.0" },
    { icon: <Zap size={15} />, label: "Passport.js" },
    { icon: <ShieldCheck size={15} />, label: "Redux Persist" },
    { icon: <MessageSquare size={15} />, label: "Socket.IO Chat" },
    { icon: <Zap size={15} />, label: "React Hook Form" },
];

const DONE = [
    { icon: <Lock size={16} />, label: "JWT Authentication", done: true },
    { icon: <Globe size={16} />, label: "Google OAuth 2.0", done: true },
    { icon: <MessageSquare size={16} />, label: "Real-time Chat (1:1)", done: true },
    { icon: <ShieldCheck size={16} />, label: "Seen / Delivered Receipts", done: true },
];

const ROADMAP = [
    {
        icon: <Users size={18} />,
        label: "Group Chat",
        desc: "Rooms, admin controls, invite links, typing indicators for multiple users.",
        color: "#6366f1",
        tag: "Next up",
    },
    {
        icon: <CreditCard size={18} />,
        label: "Payments Module",
        desc: "Stripe / Razorpay integration — subscriptions, one-time payments, invoices.",
        color: "#f59e0b",
        tag: "Planned",
    },
    {
        icon: <Bot size={18} />,
        label: "AI Assistant",
        desc: "Embed Claude or GPT — smart replies, message summaries, chat search via AI.",
        color: "#10b981",
        tag: "Planned",
    },
    {
        icon: <Video size={18} />,
        label: "Video / Voice Calls",
        desc: "WebRTC peer-to-peer calls directly inside conversations.",
        color: "#ec4899",
        tag: "Ideas",
    },
    {
        icon: <Bell size={18} />,
        label: "Push Notifications",
        desc: "Web Push API + FCM for mobile — notify users even when offline.",
        color: "#8b5cf6",
        tag: "Ideas",
    },
    {
        icon: <BarChart3 size={18} />,
        label: "Analytics Dashboard",
        desc: "Message volume, active users, engagement charts for admins.",
        color: "#0ea5e9",
        tag: "Ideas",
    },
    {
        icon: <FileText size={18} />,
        label: "File & Media Sharing",
        desc: "Upload images, PDFs, voice notes via S3 presigned URLs.",
        color: "#f97316",
        tag: "Ideas",
    },
    {
        icon: <Layers size={18} />,
        label: "Multi-tenancy / Workspaces",
        desc: "Slack-style workspaces — multiple orgs under one platform.",
        color: "#14b8a6",
        tag: "Ideas",
    },
];

const TAG_COLOR: Record<string, string> = {
    "Next up": "#6366f1",
    "Planned": "#f59e0b",
    "Ideas": "#64748b",
};

export default function Home() {
    const token = useSelector(getToken);
    const heroRef = useRef<HTMLDivElement>(null);

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
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                :root {
                    --bg: #07080d;
                    --surface: #0e1117;
                    --border: rgba(255,255,255,0.08);
                    --accent: #4f8dff;
                    --accent2: #a78bfa;
                    --text: #f0f2f8;
                    --muted: #6b7280;
                    --font-display: 'Syne', sans-serif;
                    --font-body: 'DM Sans', sans-serif;
                }

                body { background: var(--bg); color: var(--text); font-family: var(--font-body); }

                /* ── nav ── */
                .nav {
                    position: sticky; top: 0; z-index: 50;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0 2rem; height: 64px;
                    background: rgba(7,8,13,0.8);
                    backdrop-filter: blur(16px);
                    border-bottom: 1px solid var(--border);
                }
                .logo { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-size: 1.2rem; }
                .logo-icon { width: 36px; height: 36px; background: var(--accent); border-radius: 10px; display:flex; align-items:center; justify-content:center; }
                .nav-actions { display: flex; gap: 10px; }
                .btn-ghost {
                    padding: 8px 18px; border-radius: 8px; border: 1px solid var(--border);
                    background: transparent; color: var(--text); font-family: var(--font-body);
                    font-size: .875rem; cursor: pointer; transition: border-color .2s;
                    text-decoration: none; display: inline-flex; align-items: center;
                }
                .btn-ghost:hover { border-color: var(--accent); }
                .btn-primary {
                    padding: 8px 20px; border-radius: 8px; border: none;
                    background: var(--accent); color: #fff; font-family: var(--font-body);
                    font-size: .875rem; font-weight: 500; cursor: pointer;
                    transition: opacity .2s; text-decoration: none;
                    display: inline-flex; align-items: center; gap: 6px;
                }
                .btn-primary:hover { opacity: .88; }

                /* ── hero ── */
                .hero {
                    --mx: 0px; --my: 0px;
                    position: relative; overflow: hidden;
                    min-height: calc(100vh - 64px);
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    text-align: center; padding: 6rem 2rem;
                }
                .hero-glow {
                    position: absolute; inset: 0; pointer-events: none;
                    background:
                        radial-gradient(ellipse 60% 50% at 30% 40%, rgba(79,141,255,.13) 0%, transparent 70%),
                        radial-gradient(ellipse 50% 40% at 70% 60%, rgba(167,139,250,.10) 0%, transparent 70%);
                    transform: translate(var(--mx), var(--my));
                    transition: transform .08s linear;
                }
                .hero-grid {
                    position: absolute; inset: 0; pointer-events: none; opacity: .04;
                    background-image: linear-gradient(var(--border) 1px, transparent 1px),
                                      linear-gradient(90deg, var(--border) 1px, transparent 1px);
                    background-size: 48px 48px;
                }
                .badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    font-size: .75rem; font-weight: 500; letter-spacing: .04em;
                    color: var(--accent); background: rgba(79,141,255,.1);
                    border: 1px solid rgba(79,141,255,.25); border-radius: 999px;
                    padding: 4px 14px; margin-bottom: 2rem;
                    animation: fadeUp .6s ease both;
                }
                .hero h1 {
                    font-family: var(--font-display); font-size: clamp(2.8rem, 7vw, 5.5rem);
                    line-height: 1.05; letter-spacing: -.02em; color: var(--text);
                    max-width: 820px; margin-bottom: 1.5rem;
                    animation: fadeUp .7s .1s ease both;
                }
                .hero h1 em { font-style: normal; color: var(--accent); }
                .hero p {
                    font-size: 1.1rem; color: var(--muted); max-width: 560px; line-height: 1.7;
                    margin-bottom: 2.5rem; animation: fadeUp .7s .2s ease both;
                }
                .hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; animation: fadeUp .7s .3s ease both; }
                .btn-lg { padding: 12px 28px; font-size: 1rem; border-radius: 10px; }

                /* particles */
                .particle-dot {
                    position: absolute; border-radius: 50%;
                    background: var(--accent); opacity: .5;
                    animation: float linear infinite;
                }
                @keyframes float {
                    0%   { transform: translateY(0) scale(1); opacity: .4; }
                    50%  { opacity: .8; }
                    100% { transform: translateY(-120px) scale(.6); opacity: 0; }
                }

                /* ── stats ── */
                .stats {
                    display: flex; justify-content: center; gap: 3rem; flex-wrap: wrap;
                    padding: 3rem 2rem; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
                    background: var(--surface);
                }
                .stat { text-align: center; }
                .stat-num { font-family: var(--font-display); font-size: 2.4rem; color: var(--text); }
                .stat-label { font-size: .8rem; color: var(--muted); margin-top: 4px; text-transform: uppercase; letter-spacing: .08em; }

                /* ── stack pills ── */
                .section { padding: 5rem 2rem; max-width: 1100px; margin: 0 auto; }
                .section-label {
                    font-size: .75rem; letter-spacing: .12em; text-transform: uppercase;
                    color: var(--accent); font-weight: 600; margin-bottom: .75rem;
                }
                .section-title { font-family: var(--font-display); font-size: clamp(1.8rem,4vw,2.6rem); margin-bottom: 1rem; }
                .section-sub { color: var(--muted); font-size: 1rem; line-height: 1.7; max-width: 520px; margin-bottom: 2.5rem; }

                .pills { display: flex; flex-wrap: wrap; gap: 10px; }
                .pill {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 8px 16px; border-radius: 999px;
                    border: 1px solid var(--border); background: var(--surface);
                    font-size: .875rem; color: var(--text);
                    transition: border-color .2s, transform .2s;
                }
                .pill:hover { border-color: var(--accent); transform: translateY(-2px); }

                /* ── done / roadmap ── */
                .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                @media(max-width:720px){ .two-col { grid-template-columns: 1fr; } }

                .done-list { display: flex; flex-direction: column; gap: 12px; }
                .done-item {
                    display: flex; align-items: center; gap: 12px;
                    padding: 14px 18px; border-radius: 12px;
                    background: var(--surface); border: 1px solid var(--border);
                }
                .done-check {
                    width: 24px; height: 24px; border-radius: 50%;
                    background: rgba(16,185,129,.15); color: #10b981;
                    display: flex; align-items: center; justify-content: center; font-size: .7rem; flex-shrink: 0;
                }

                /* roadmap grid */
                .roadmap-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 16px; }
                .road-card {
                    background: var(--surface); border: 1px solid var(--border);
                    border-radius: 14px; padding: 20px;
                    transition: border-color .25s, transform .25s;
                    position: relative; overflow: hidden;
                }
                .road-card::before {
                    content: ''; position: absolute; inset: 0;
                    background: var(--card-color); opacity: 0;
                    transition: opacity .25s;
                }
                .road-card:hover { transform: translateY(-4px); border-color: var(--card-color); }
                .road-card:hover::before { opacity: .05; }
                .road-icon {
                    width: 38px; height: 38px; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 14px; color: #fff;
                }
                .road-title { font-family: var(--font-display); font-size: 1rem; margin-bottom: 6px; }
                .road-desc { font-size: .83rem; color: var(--muted); line-height: 1.6; }
                .road-tag {
                    display: inline-block; margin-top: 12px;
                    font-size: .7rem; font-weight: 600; letter-spacing: .06em;
                    padding: 2px 10px; border-radius: 999px; color: #fff;
                }

                /* ── CTA band ── */
                .cta-band {
                    margin: 4rem 2rem; border-radius: 20px;
                    padding: 4rem 2rem; text-align: center;
                    background: linear-gradient(135deg, rgba(79,141,255,.12), rgba(167,139,250,.08));
                    border: 1px solid rgba(79,141,255,.2);
                    position: relative; overflow: hidden;
                }
                .cta-band h2 { font-family: var(--font-display); font-size: clamp(1.6rem,4vw,2.4rem); margin-bottom: 1rem; }
                .cta-band p { color: var(--muted); margin-bottom: 2rem; font-size: 1rem; }

                /* ── footer ── */
                .footer {
                    border-top: 1px solid var(--border); padding: 2rem;
                    text-align: center; color: var(--muted); font-size: .82rem;
                }

                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* NAV */}
            <header className="nav">
                <div className="logo">
                    <div className="logo-icon">
                        <ShieldCheck size={18} color="#fff" />
                    </div>
                    NexusApp
                </div>
                <div className="nav-actions">
                    {token ? (
                        <Link to={ROUTES.DASHBOARD.path} className="btn-primary">
                            Dashboard <ArrowRight size={14} />
                        </Link>
                    ) : (
                        <>
                            <Link to={ROUTES.LOGIN.path} className="btn-ghost">Sign in</Link>
                            <Link to={ROUTES.REGISTER.path} className="btn-primary">
                                Get started <ArrowRight size={14} />
                            </Link>
                        </>
                    )}
                </div>
            </header>

            {/* HERO */}
            <section className="hero" ref={heroRef}>
                <div className="hero-glow" />
                <div className="hero-grid" />

                {/* floating particles */}
                {[
                    { w: 4, l: "15%", t: "70%", dur: "6s", del: "0s" },
                    { w: 6, l: "80%", t: "60%", dur: "8s", del: "1s" },
                    { w: 3, l: "50%", t: "80%", dur: "7s", del: "2s" },
                    { w: 5, l: "25%", t: "50%", dur: "9s", del: ".5s" },
                    { w: 4, l: "65%", t: "75%", dur: "6.5s", del: "3s" },
                ].map((p, i) => (
                    <Dot key={i} style={{
                        width: p.w, height: p.w,
                        left: p.l, top: p.t,
                        animationDuration: p.dur, animationDelay: p.del,
                    }} />
                ))}

                <div className="badge">
                    <Sparkles size={12} /> Full-stack · Real-time · Production-ready
                </div>

                <h1>
                    Build apps with auth,<br />
                    chat & <em>everything else</em>
                </h1>

                <p>
                    JWT + Google OAuth, real-time messaging with seen receipts,
                    and a growing suite of features — all in one platform.
                </p>

                {!token && (
                    <div className="hero-ctas">
                        <Link to={ROUTES.REGISTER.path} className="btn-primary btn-lg">
                            Create free account <ArrowRight size={15} />
                        </Link>
                        <Link to={ROUTES.LOGIN.path} className="btn-ghost btn-lg">
                            Sign in
                        </Link>
                    </div>
                )}
            </section>

            {/* STATS */}
            <div className="stats">
                {[
                    { to: 12000, suffix: "+", label: "Messages sent" },
                    { to: 3, suffix: "ms", label: "Avg. delivery time" },
                    { to: 99, suffix: ".9%", label: "Uptime SLA" },
                    { to: 8, suffix: " features", label: "Roadmap items" },
                ].map(s => (
                    <div className="stat" key={s.label}>
                        <div className="stat-num"><Counter to={s.to} suffix={s.suffix} /></div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* TECH STACK */}
            <div className="section">
                <div className="section-label">Stack</div>
                <h2 className="section-title">What's already built</h2>
                <p className="section-sub">
                    A solid, production-ready foundation so you can focus on shipping features.
                </p>
                <div className="pills">
                    {STACK.map(s => (
                        <span className="pill" key={s.label}>{s.icon} {s.label}</span>
                    ))}
                </div>
            </div>

            {/* DONE + ROADMAP */}
            <div className="section" style={{ paddingTop: 0 }}>
                <div className="two-col" style={{ marginBottom: "3rem" }}>
                    <div>
                        <div className="section-label">Shipped ✓</div>
                        <h2 className="section-title" style={{ fontSize: "1.6rem" }}>Live today</h2>
                        <div className="done-list" style={{ marginTop: "1.5rem" }}>
                            {DONE.map(d => (
                                <div className="done-item" key={d.label}>
                                    <div className="done-check">✓</div>
                                    <span style={{ color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                                        {d.icon} {d.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div className="section-label">Coming next</div>
                        <h2 className="section-title" style={{ fontSize: "1.6rem" }}>What's being built</h2>
                        <p className="section-sub" style={{ marginBottom: 0 }}>
                            Group chat and payments are next on the roadmap. Below is the full
                            wishlist — contributions and ideas welcome.
                        </p>
                    </div>
                </div>

                {/* ROADMAP CARDS */}
                <div className="section-label">Roadmap</div>
                <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>What's coming</h2>
                <div className="roadmap-grid">
                    {ROADMAP.map(r => (
                        <div
                            className="road-card"
                            key={r.label}
                            style={{ ["--card-color" as string]: r.color }}
                        >
                            <div className="road-icon" style={{ background: r.color + "22", color: r.color }}>
                                {r.icon}
                            </div>
                            <div className="road-title">{r.label}</div>
                            <div className="road-desc">{r.desc}</div>
                            <span className="road-tag" style={{ background: TAG_COLOR[r.tag] + "33", color: TAG_COLOR[r.tag] }}>
                                {r.tag}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA BAND */}
            {!token && (
                <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
                    <div className="cta-band">
                        <h2>Ready to start building?</h2>
                        <p>Sign up in seconds. No credit card required.</p>
                        <div className="hero-ctas">
                            <Link to={ROUTES.REGISTER.path} className="btn-primary btn-lg">
                                Create free account <ArrowRight size={15} />
                            </Link>
                            <Link to={ROUTES.LOGIN.path} className="btn-ghost btn-lg">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <footer className="footer">
                © {new Date().getFullYear()} NexusApp · Built with Node.js, React & Socket.IO
            </footer>
        </>
    );
}