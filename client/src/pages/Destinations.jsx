import { useState } from "react";
import { getDestinations } from "../api/api";
import { useResource } from "../hooks/useResource";
import { useSeo } from "../hooks/useSeo";
import { site } from "../config/site";
import { destinationRegions, filterDestinations } from "../utils/catalog";
import PageHero from "../components/common/PageHero";
import DestinationCard from "../components/cards/DestinationCard";
import { ErrorState, EmptyState } from "../components/common/States";
import { CardSkeletons } from "../components/common/CatalogStates";
import TravelCta from "../components/common/TravelCta";
import styles from "./Catalog.module.css";
export default function Destinations() {
  useSeo(
    "Destinations",
    "Explore North India’s cities, mountain landscapes and cultural regions. Discover destinations and journeys with Sudha Tourism.",
  );
  const resource = useResource(getDestinations);
  const [region, setRegion] = useState("");
  const items = resource.data || [];
  const filtered = filterDestinations(items, region);
  return (
    <>
      <PageHero
        image={site.heroImage}
        alt={site.heroImageAlt}
        eyebrow="A sense of place"
        title="Explore North India"
        description="Forts and river towns. Mountain paths and city streets. Discover places that invite you to look a little closer."
        breadcrumbs={[{ label: "Destinations" }]}
      />
      <section className="section container">
        <div className={styles.intro}>
          <div>
            <h2>
              Different places.
              <br />
              Endless ways to explore.
            </h2>
            <p>
              Find the landscapes, cultures and quieter corners that belong in
              your next journey.
            </p>
          </div>
        </div>
        {resource.loading ? (
          <CardSkeletons />
        ) : resource.error ? (
          <ErrorState retry={resource.retry} />
        ) : (
          <>
            <div
              className={styles.chips}
              role="group"
              aria-label="Filter destinations by region"
            >
              {["", ...destinationRegions(items)].map((value) => (
                <button
                  key={value}
                  className={styles.chip}
                  aria-pressed={region === value}
                  onClick={() => setRegion(value)}
                >
                  {value || "All"}
                </button>
              ))}
            </div>
            <p className={styles.count} role="status">
              {filtered.length}{" "}
              {filtered.length === 1 ? "destination" : "destinations"} to
              explore
            </p>
            {filtered.length ? (
              <div className={styles.destinationGrid}>
                {filtered.map((destination) => (
                  <DestinationCard
                    key={destination.id}
                    destination={destination}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No destinations in this selection."
                description="Choose another region to keep exploring."
              />
            )}
          </>
        )}
      </section>
      <TravelCta title="Where would you like to go?" />
    </>
  );
}
