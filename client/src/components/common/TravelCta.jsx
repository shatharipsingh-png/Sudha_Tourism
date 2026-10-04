import { ArrowRight } from "lucide-react";
import Button from "./Button";
import { useEnquiry } from "../../context/EnquiryContext";
import styles from "./TravelCta.module.css";
export default function TravelCta({
  title = "A journey that feels like you.",
  description = "Share your ideas and let’s explore the possibilities together.",
  context = {},
  to = "/packages",
  linkLabel = "Browse Packages",
}) {
  const { openEnquiry } = useEnquiry();
  return (
    <section className={styles.cta}>
      <div className={`container ${styles.inner}`}>
        <div>
          <p className={styles.eyebrow}>Make it your own</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className={styles.actions}>
          <Button onClick={() => openEnquiry(context)}>
            Plan Your Trip <ArrowRight size={17} aria-hidden="true" />
          </Button>
          <Button variant="outline" to={to}>
            {linkLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
