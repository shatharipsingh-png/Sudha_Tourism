import { Suspense, useEffect, useRef } from "react";
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
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!initial.current)
      document.getElementById("main-content")?.focus({ preventScroll: true });
    initial.current = false;
  }, [location.pathname, location.search]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className={location.pathname === "/" ? "" : styles.solidMain}
      >
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
      <EnquiryModal />
    </>
  );
}
