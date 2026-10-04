import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { navigation, site } from "../../config/site";
import { useDialog } from "../../hooks/useDialog";
import { useEnquiry } from "../../context/EnquiryContext";
import Button from "../common/Button";
import styles from "./Layout.module.css";
export default function Header({ hasHero = false }) {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(window.scrollY > 24);
  const [menu, setMenu] = useState(false);
  const close = useCallback(() => setMenu(false), []);
  const dialog = useDialog(menu, close);
  const { openEnquiry } = useEnquiry();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => close(), [pathname, close]);
  const clear = (pathname === "/" || hasHero) && !scrolled;
  return (
    <>
      <header className={`${styles.header} ${clear ? styles.transparent : ""}`}>
        <div className={`container ${styles.headerInner}`}>
          <Link
            to="/"
            className={styles.brand}
            aria-label={`${site.businessName} home`}
          >
            {site.businessName.split(" ")[0]}
            <span>{site.businessName.split(" ").slice(1).join(" ")}</span>
          </Link>
          <nav aria-label="Main navigation" className={styles.desktopNav}>
            {navigation.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) => (isActive ? styles.active : "")}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Button className={styles.headerCta} onClick={() => openEnquiry()}>
            Plan Your Trip <ArrowUpRight size={16} aria-hidden="true" />
          </Button>
          <button
            className={styles.menuTrigger}
            aria-label="Open navigation"
            aria-expanded={menu}
            aria-controls="mobile-navigation"
            onClick={() => setMenu(true)}
          >
            <Menu size={26} aria-hidden="true" />
          </button>
        </div>
      </header>
      <dialog
        id="mobile-navigation"
        ref={dialog}
        className={styles.mobileDialog}
        aria-labelledby="navigation-title"
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
      >
        <div className={styles.mobileTop}>
          <h2 id="navigation-title">Explore with {site.businessName}</h2>
          <button onClick={close} aria-label="Close navigation">
            <X aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          {navigation.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={close}
              className={({ isActive }) => (isActive ? styles.active : "")}
            >
              {label}
              <ArrowUpRight size={20} aria-hidden="true" />
            </NavLink>
          ))}
        </nav>
        <Button
          onClick={() => {
            close();
            requestAnimationFrame(() => openEnquiry());
          }}
        >
          Plan Your Trip
        </Button>
      </dialog>
    </>
  );
}
