import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { getDestination } from "../api/api";
import { useResource } from "../hooks/useResource";
import { useSeo } from "../hooks/useSeo";
import { useEnquiry } from "../context/EnquiryContext";
import PageHero from "../components/common/PageHero";
import Button from "../components/common/Button";
import SectionHeading from "../components/common/SectionHeading";
import Image from "../components/common/Image";
import PackageCard from "../components/cards/PackageCard";
import TravelCta from "../components/common/TravelCta";
import {
  DetailState,
  CustomTripEmpty,
} from "../components/common/CatalogStates";
import styles from "./Detail.module.css";
import catalog from "./Catalog.module.css";
export default function DestinationDetail() {
  const { slug } = useParams();
  const loader = useCallback((signal) => getDestination(slug, signal), [slug]);
  const resource = useResource(loader);
  const d = resource.data;
  useSeo(
    resource.error?.status === 404
      ? "Page not found"
      : d?.name || "Destination",
    d?.short_desc || "Explore destinations in North India with Sudha Tourism.",
    {
      image: d?.image,
      robots: resource.error ? "noindex,nofollow" : undefined,
      destination: d,
      breadcrumbs: d
        ? [
            { label: "Home", path: "/" },
            { label: "Destinations", path: "/destinations" },
            { label: d.name, path: `/destinations/${d.slug}` },
          ]
        : undefined,
    },
  );
  const { openEnquiry } = useEnquiry();
  if (!d || resource.loading || resource.error)
    return <DetailState resource={resource} />;
  const context = { destinationId: d.id, destinationName: d.name };
  return (
    <>
      <PageHero
        image={d.image}
        alt={d.name}
        eyebrow={d.region}
        title={d.name}
        description={d.short_desc}
        breadcrumbs={[
          { label: "Destinations", to: "/destinations" },
          { label: d.name },
        ]}
      >
        <Button onClick={() => openEnquiry(context)}>Plan Your Trip</Button>
        <Button
          variant="outline"
          to={`/packages?destination=${encodeURIComponent(d.slug)}`}
        >
          Browse Packages
        </Button>
      </PageHero>
      <section className={`section container ${styles.story}`}>
        <div>
          <p className={styles.eyebrow}>Get to know {d.name}</p>
          <h2>
            A place with <br />
            its own story.
          </h2>
        </div>
        <div className={styles.prose}>
          <p>{d.description}</p>
        </div>
      </section>
      {d.why_visit?.length > 0 && (
        <section className={`section ${styles.soft}`}>
          <div className="container">
            <SectionHeading
              eyebrow="Reasons to linger"
              title={`Why visit ${d.name}?`}
            />
            <ol className={styles.reasonGrid}>
              {d.why_visit.map((reason, i) => (
                <li key={i}>
                  <span>0{i + 1}</span>
                  <p>{reason}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
      {d.top_places?.length > 0 && (
        <section className="section container">
          <SectionHeading
            eyebrow="Along the way"
            title="Places to discover"
            description="Find a few starting points for your own route."
          />
          <div className={styles.places}>
            {d.top_places.map((place, i) => (
              <article key={i}>
                {place.image && place.image !== d.image && (
                  <Image
                    src={place.image}
                    alt={place.name}
                    className={styles.placeImage}
                  />
                )}
                <span className={styles.placeNumber}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{place.name}</h3>
                <p>{place.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      <section className={`section ${styles.soft}`}>
        <div className="container">
          <SectionHeading
            eyebrow="Your next chapter"
            title={`Journeys Through ${d.name}`}
          />
          {d.packages?.length ? (
            <div className={catalog.cardGrid}>
              {d.packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  travelPackage={{ ...pkg, destination_name: d.name }}
                />
              ))}
            </div>
          ) : (
            <CustomTripEmpty context={context} />
          )}
        </div>
      </section>
      {d.travel_info && (
        <section className="section container">
          <SectionHeading
            eyebrow="Before you go"
            title="A little practical guidance"
          />
          <div className={styles.travelInfo}>
            {d.travel_info.best_time && (
              <div>
                <h3>Best time to visit</h3>
                <p>{d.travel_info.best_time}</p>
              </div>
            )}
            {d.travel_info.how_to_reach && (
              <div>
                <h3>Getting there</h3>
                <p>{d.travel_info.how_to_reach}</p>
              </div>
            )}
            {d.travel_info.tips?.length > 0 && (
              <div>
                <h3>Travel notes</h3>
                <ul>
                  {d.travel_info.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
      <TravelCta
        title={`Ready to explore ${d.name}?`}
        context={context}
        to={`/packages?destination=${encodeURIComponent(d.slug)}`}
      />
    </>
  );
}
