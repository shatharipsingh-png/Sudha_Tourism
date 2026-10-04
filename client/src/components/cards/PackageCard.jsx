import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, MapPin, Star } from "lucide-react";
import Image from "../common/Image";
import { formatPrice } from "../../utils/forms";
import styles from "./Cards.module.css";
export default function PackageCard({ travelPackage: pkg }) {
  const hasRating =
    pkg.rating != null &&
    Number.isFinite(Number(pkg.rating)) &&
    Number(pkg.rating) > 0;
  return (
    <article className={styles.package}>
      <Link
        to={`/packages/${pkg.slug}`}
        className={styles.packageImageLink}
        aria-label={pkg.title}
      >
        <Image
          src={pkg.image}
          alt={pkg.title}
          className={styles.packageImage}
        />
        {Boolean(pkg.best_seller) && (
          <span className={styles.badge}>Best seller</span>
        )}
      </Link>
      <div className={styles.packageBody}>
        <p className={styles.location}>
          <MapPin size={13} aria-hidden="true" />
          {pkg.destination_name || pkg.destination?.name || pkg.route}
        </p>
        <h3>
          <Link to={`/packages/${pkg.slug}`}>{pkg.title}</Link>
        </h3>
        <div className={styles.metadata}>
          <span>
            <Clock3 size={14} aria-hidden="true" />
            {pkg.duration_days} days
          </span>
          <span>{pkg.category}</span>
          {hasRating && (
            <span aria-label={`Rating ${pkg.rating} out of 5`}>
              <Star size={13} aria-hidden="true" />
              {pkg.rating}
            </span>
          )}
        </div>
        <div className={styles.price}>
          <div>
            <small>Journey from</small>
            <strong>{formatPrice(pkg.price)}</strong>
          </div>
          <Link
            to={`/packages/${pkg.slug}`}
            aria-label={`View ${pkg.title}`}
            className={styles.packageArrow}
          >
            <ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
