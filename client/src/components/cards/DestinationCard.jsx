import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Image from "../common/Image";
import styles from "./Cards.module.css";
export default function DestinationCard({ destination }) {
  return (
    <Link
      to={`/destinations/${destination.slug}`}
      className={styles.destination}
    >
      <Image
        src={destination.image}
        alt={destination.name}
        className={styles.destinationImage}
      />
      <div className={styles.destinationContent}>
        <span className={styles.region}>{destination.region}</span>
        <h3>{destination.name}</h3>
        <p>{destination.short_desc}</p>
        <span className={styles.circle}>
          <ArrowUpRight size={19} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
