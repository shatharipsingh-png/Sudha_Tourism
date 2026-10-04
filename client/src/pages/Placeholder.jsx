import { useLocation, useParams } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";
import { useSeo } from "../hooks/useSeo";
import { useEnquiry } from "../context/EnquiryContext";
import Button from "../components/common/Button";
import styles from "./SimplePage.module.css";
const titles = {
  destinations: "Destinations",
  packages: "Packages",
  experiences: "Experiences",
  about: "About Sudha Tourism",
  contact: "Contact",
  privacy: "Privacy",
  terms: "Terms",
  cancellation: "Cancellation",
};
export default function Placeholder() {
  const { pathname, search } = useLocation();
  const { slug } = useParams();
  const type = pathname.split("/")[1];
  const title = titles[type] || "Explore";
  useSeo(title, `${title} — this page is being prepared for Sudha Tourism.`);
  const { openEnquiry } = useEnquiry();
  return (
    <section className={`container ${styles.page}`}>
      <Compass
        className={styles.icon}
        size={40}
        strokeWidth={1.3}
        aria-hidden="true"
      />
      <p className={styles.eyebrow}>More to come</p>
      <h1>
        {slug
          ? title === "Packages"
            ? "Your next journey"
            : "A place to discover"
          : title}
      </h1>
      <p>This page is being prepared. There’s more to explore soon.</p>
      {type === "packages" && search && (
        <p className={styles.note}>
          Your search preferences are saved in this page’s link. Detailed
          results are coming soon.
        </p>
      )}
      <div className={styles.actions}>
        <Button to="/">
          Return Home <ArrowRight size={17} aria-hidden="true" />
        </Button>
        {!["privacy", "terms", "cancellation"].includes(type) && (
          <Button variant="outline" onClick={() => openEnquiry()}>
            Plan Your Trip
          </Button>
        )}
      </div>
    </section>
  );
}
