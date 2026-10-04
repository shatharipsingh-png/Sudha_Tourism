import { Compass, RotateCcw } from "lucide-react";
import Button from "./Button";
import styles from "./States.module.css";
export function Skeleton({ className = "" }) {
  return (
    <div className={`${styles.skeleton} ${className}`} aria-hidden="true" />
  );
}
export function ErrorState({
  retry,
  message = "This part of the journey couldn’t load.",
}) {
  return (
    <div className={styles.state} role="alert">
      <Compass size={30} aria-hidden="true" />
      <h3>{message}</h3>
      <p>Please try again in a moment.</p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          <RotateCcw size={16} aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
export function EmptyState({
  title = "More journeys are on their way.",
  description = "In the meantime, tell us what you have in mind.",
}) {
  return (
    <div className={styles.state}>
      <Compass size={30} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function PageLoader() {
  return (
    <div className={styles.page} role="status">
      <Compass size={36} aria-hidden="true" />
      <p>Finding your next destination…</p>
    </div>
  );
}
