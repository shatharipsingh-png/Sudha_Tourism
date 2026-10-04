import { Compass, ArrowRight } from "lucide-react";
import { useSeo } from "../hooks/useSeo";
import Button from "../components/common/Button";
import styles from "./SimplePage.module.css";
export default function NotFound() {
  useSeo(
    "Page not found",
    "This trail seems to lead somewhere else. Explore North India with Sudha Tourism.",
  );
  return (
    <section className={`container ${styles.page}`}>
      <Compass
        size={54}
        strokeWidth={1.2}
        className={styles.icon}
        aria-hidden="true"
      />
      <p className={styles.eyebrow}>404 · A little off the beaten path</p>
      <h1>
        This trail seems to
        <br />
        lead somewhere else.
      </h1>
      <p>
        The page you’re looking for has wandered away. Let’s find your next
        destination.
      </p>
      <div className={styles.actions}>
        <Button to="/">
          Return Home <ArrowRight size={17} aria-hidden="true" />
        </Button>
        <Button variant="outline" to="/destinations">
          Explore Destinations
        </Button>
      </div>
    </section>
  );
}
