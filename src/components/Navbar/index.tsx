import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
    MessageSquare, LayoutDashboard, LogOut,
    ChevronDown, ShieldCheck, Bell,
    Home
} from "lucide-react";
import { getUser, clearAuth } from "@/redux/slices/auth.slice";
import { ROUTES } from "@/constants/routes";
import Button from "@/common/Button";

const NAV_LINKS = [
    { to: ROUTES.DASHBOARD.path, icon: <LayoutDashboard size={16} />, label: "Dashboard" },
    { to: ROUTES.CHAT.path, icon: <MessageSquare size={16} />, label: "Messages" },
    { to: ROUTES.HOME.path, icon: <Home size={16} />, label: 'Home' }
];

export default function Navbar() {
    const user = useSelector(getUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);

    /* close dropdown on outside click */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const logout = () => {
        dispatch(clearAuth());
        navigate("/");
    };

    const initials = user?.name
        ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

                .nb {
                    position: sticky; top: 0; z-index: 100;
                    height: 60px;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0 1.5rem;
                    background: rgba(10,11,18,0.85);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                    font-family: 'DM Sans', sans-serif;
                }

                .nb-logo {
                    display: flex; align-items: center; gap: 9px;
                    font-family: 'Syne', sans-serif; font-size: 1.1rem;
                    color: #f0f2f8; text-decoration: none;
                }
                .nb-logo-icon {
                    width: 32px; height: 32px; border-radius: 9px;
                    background: #4f8dff;
                    display: flex; align-items: center; justify-content: center;
                }

                .nb-links {
                    display: flex; align-items: center; gap: 4px;
                    position: absolute; left: 50%; transform: translateX(-50%);
                }
                .nb-link {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 6px 14px; border-radius: 8px;
                    font-size: .875rem; color: #9ca3af;
                    text-decoration: none;
                    transition: color .15s, background .15s;
                    border: 1px solid transparent;
                }
                .nb-link:hover  { color: #f0f2f8; background: rgba(255,255,255,.06); }
                .nb-link.active {
                    color: #4f8dff;
                    background: rgba(79,141,255,.1);
                    border-color: rgba(79,141,255,.2);
                }

                .nb-right { display: flex; align-items: center; gap: 10px; }

                /* bell */
                .nb-bell {
                    width: 36px; height: 36px; border-radius: 9px;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.07);
                    color: #9ca3af; cursor: pointer; transition: color .15s, background .15s;
                    position: relative;
                }
                .nb-bell:hover { color: #f0f2f8; background: rgba(255,255,255,.1); }
                .nb-bell-dot {
                    position: absolute; top: 7px; right: 8px;
                    width: 6px; height: 6px; border-radius: 50%;
                    background: #4f8dff; border: 1.5px solid #0a0b12;
                }

                /* avatar dropdown */
                .nb-avatar-wrap { position: relative; }
                .nb-avatar-btn {
                    display: flex; align-items: center; gap: 8px;
                    padding: 4px 10px 4px 4px; border-radius: 10px;
                    border: 1px solid rgba(255,255,255,.07);
                    background: rgba(255,255,255,.04);
                    cursor: pointer; transition: background .15s;
                }
                .nb-avatar-btn:hover { background: rgba(255,255,255,.09); }
                .nb-avatar {
                    width: 30px; height: 30px; border-radius: 8px;
                    background: linear-gradient(135deg,#4f8dff,#a78bfa);
                    display: flex; align-items: center; justify-content: center;
                    font-size: .72rem; font-weight: 700; color: #fff;
                    font-family: 'Syne', sans-serif;
                    flex-shrink: 0;
                }
                .nb-name { font-size: .825rem; color: #f0f2f8; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .nb-chevron { color: #6b7280; transition: transform .2s; }
                .nb-chevron.up { transform: rotate(180deg); }

                /* dropdown menu */
                .nb-drop {
                    position: absolute; top: calc(100% + 8px); right: 0;
                    min-width: 180px;
                    background: #0e1117; border: 1px solid rgba(255,255,255,.09);
                    border-radius: 12px; padding: 6px;
                    box-shadow: 0 20px 60px rgba(0,0,0,.6);
                    animation: dropIn .15s ease;
                }
                @keyframes dropIn {
                    from { opacity:0; transform: translateY(-6px); }
                    to   { opacity:1; transform: translateY(0); }
                }
                .nb-drop-header {
                    padding: 8px 10px 10px;
                    border-bottom: 1px solid rgba(255,255,255,.06);
                    margin-bottom: 6px;
                }
                .nb-drop-name { font-size: .85rem; color: #f0f2f8; font-weight: 500; }
                .nb-drop-status {
                    display: flex; align-items: center; gap: 5px;
                    font-size: .72rem; color: #6b7280; margin-top: 2px;
                }
                .nb-drop-dot {
                    width: 6px; height: 6px; border-radius: 50%; background: #10b981;
                }
                .nb-drop-item {
                    display: flex; align-items: center; gap: 9px;
                    padding: 8px 10px; border-radius: 8px;
                    font-size: .83rem; color: #9ca3af; cursor: pointer;
                    transition: background .12s, color .12s;
                    border: none; background: transparent; width: 100%; text-align: left;
                    font-family: 'DM Sans', sans-serif;
                }
                .nb-drop-item:hover { background: rgba(255,255,255,.06); color: #f0f2f8; }
                .nb-drop-item.danger:hover { background: rgba(239,68,68,.1); color: #f87171; }
            `}</style>

            <nav className="nb">
                {/* Logo */}
                <Link to={ROUTES.DASHBOARD.path} className="nb-logo">
                    <div className="nb-logo-icon">
                        <ShieldCheck size={16} color="#fff" />
                    </div>
                    NexusApp
                </Link>

                {/* Center nav links */}
                <div className="nb-links">
                    {NAV_LINKS.map(l => (
                        <Link
                            key={l.to}
                            to={l.to}
                            className={`nb-link ${location.pathname === l.to ? "active" : ""}`}
                        >
                            {l.icon} {l.label}
                        </Link>
                    ))}
                </div>

                {/* Right side */}
                <div className="nb-right">
                    {/* Bell */}
                    <div className="nb-bell">
                        <Bell size={16} />
                        <span className="nb-bell-dot" />
                    </div>

                    {/* Avatar dropdown */}
                    <div className="nb-avatar-wrap" ref={dropRef}>
                        <div className="nb-avatar-btn" onClick={() => setOpen(p => !p)}>
                            <div className="nb-avatar">{initials}</div>
                            <span className="nb-name">{user?.name ?? "User"}</span>
                            <ChevronDown size={13} className={`nb-chevron ${open ? "up" : ""}`} />
                        </div>

                        {open && (
                            <div className="nb-drop">
                                <div className="nb-drop-header">
                                    <div className="nb-drop-name">{user?.name}</div>
                                    <div className="nb-drop-status">
                                        <span className="nb-drop-dot" /> Online
                                    </div>
                                </div>
                                <Button className="nb-drop-item danger" onClick={logout}>
                                    <LogOut size={14} /> Sign out
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}