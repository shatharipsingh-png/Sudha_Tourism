import { PageLoader, ErrorState, EmptyState, Skeleton } from "./States";
import Button from "./Button";
import { useEnquiry } from "../../context/EnquiryContext";
import NotFound from "../../pages/NotFound";
import styles from "../../pages/Catalog.module.css";
export function DetailState({ resource }) {
  if (resource.loading) return <PageLoader />;
  if (resource.error?.status === 404) return <NotFound />;
  return (
    <section className="section container">
      <ErrorState retry={resource.retry} />
    </section>
  );
}
export function CardSkeletons({ count = 3 }) {
  return (
    <div
      className={styles.cardGrid}
      role="status"
      aria-label="Loading journeys"
    >
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
}
export function CustomTripEmpty({
  title = "No listed journeys yet.",
  description = "Tell us about the places you would like to explore.",
  context = {},
  clear,
}) {
  const { openEnquiry } = useEnquiry();
  return (
    <>
      <EmptyState title={title} description={description} />
      <div className={styles.emptyActions}>
        {clear && (
          <Button variant="outline" onClick={clear}>
            Clear Filters
          </Button>
        )}
        <Button onClick={() => openEnquiry(context)}>Plan a Custom Trip</Button>
      </div>
    </>
  );
}
