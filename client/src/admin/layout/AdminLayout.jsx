import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  MapPin,
  Briefcase,
  Compass,
  Menu,
  X,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { useDialog } from "../../hooks/useDialog";
import { useAdminAuth } from "../context/AdminAuthContext";
import s from "../styles/Admin.module.css";
const links = [
  ["Dashboard", "/admin", LayoutDashboard],
  ["Leads", "/admin/leads", Inbox],
  ["Destinations", "/admin/destinations", MapPin],
  ["Packages", "/admin/packages", Briefcase],
  ["Experiences", "/admin/experiences", Compass],
];
export default function AdminLayout() {
  const { admin } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const initial = useRef(true);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDialog(open, close);
  useEffect(() => {
    close();
    window.scrollTo(0, 0);
    if (!initial.current) document.getElementById("admin-main")?.focus();
    initial.current = false;
  }, [location.pathname, close]);
  useEffect(() => {
    const mq = window.matchMedia("(min-width:901px)");
    const change = () => {
      if (mq.matches) close();
    };
    mq.addEventListener("change", change);
    return () => mq.removeEventListener("change", change);
  }, [close]);
  // Logout goes through a route first, so the form's supported navigation blocker
  // can confirm discarding edits before any session is destroyed.
  const Sidebar = () => (
    <aside className={s.sidebar} aria-label="Admin navigation">
      <Link className={s.brand} to="/admin">
        Sudha Tourism<small>Administration</small>
      </Link>
      <nav className={s.nav}>
        {links.map(([label, path, Icon]) => (
          <NavLink key={path} to={path} end={path === "/admin"}>
            <Icon aria-hidden="true" />
            {label}
          </NavLink>
        ))}
        <Link to="/">
          <ArrowUpRight aria-hidden="true" />
          View Website
        </Link>
      </nav>
      <div className={s.sidebarFooter}>
        <span className={s.account}>{admin.email}</span>
        <Link className={s.button} to="/admin/login" state={{ logout: true }}>
          <LogOut size={16} aria-hidden="true" />
          Logout
        </Link>
      </div>
    </aside>
  );
  return (
    <div className={s.shell}>
      <a className={s.skip} href="#admin-main">
        Skip to admin content
      </a>
      <Sidebar />
      <div className={s.content}>
        <header className={s.topbar}>
          <button
            className={s.menuButton}
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            aria-expanded={open}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <span>Content & enquiries</span>
          <span className={s.muted}>Admin</span>
        </header>
        <main className={s.main} id="admin-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <dialog ref={ref} className={s.drawer} aria-label="Admin menu">
        <div className={s.heading}>
          <strong>Admin menu</strong>
          <button onClick={close} aria-label="Close admin menu">
            <X size={20} />
          </button>
        </div>
        <Sidebar />
      </dialog>
    </div>
  );
}
