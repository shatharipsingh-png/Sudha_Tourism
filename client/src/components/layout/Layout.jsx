import { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import EnquiryModal from "../forms/EnquiryModal";
import { PageLoader } from "../common/States";
import styles from "./Layout.module.css";
export default function Layout() {
  const location = useLocation();
  const initial = useRef(true);
  const [hasHero, setHero] = useState(false);
  const outletContext = useMemo(() => ({ setHero }), []);
  const cinematic =
    location.pathname === "/" ||
    /^\/(destinations|packages)(\/[^/]+)?$/.test(location.pathname) ||
    ["/experiences", "/about", "/contact"].includes(location.pathname);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!initial.current)
      document.getElementById("main-content")?.focus({ preventScroll: true });
    initial.current = false;
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header hasHero={hasHero} />
      <main
        id="main-content"
        tabIndex={-1}
        className={cinematic ? "" : styles.solidMain}
      >
        <Suspense fallback={<PageLoader />}>
          <Outlet context={outletContext} />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
      <EnquiryModal />
    </>
  );
}
