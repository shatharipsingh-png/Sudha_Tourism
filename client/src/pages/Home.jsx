import {
  ArrowRight,
  Compass,
  HeartHandshake,
  Map,
  SlidersHorizontal,
  Leaf,
  Camera,
  Footprints,
  HandHeart,
} from "lucide-react";
import { site } from "../config/site";
import { useSeo } from "../hooks/useSeo";
import { useResource } from "../hooks/useResource";
import { getDestinations, getFeaturedPackages } from "../api/api";
import { useEnquiry } from "../context/EnquiryContext";
import Button from "../components/common/Button";
import Image from "../components/common/Image";
import Reveal from "../components/common/Reveal";
import SectionHeading from "../components/common/SectionHeading";
import { EmptyState, ErrorState, Skeleton } from "../components/common/States";
import DestinationCard from "../components/cards/DestinationCard";
import PackageCard from "../components/cards/PackageCard";
import TripPlanner from "../components/forms/TripPlanner";
import styles from "./Home.module.css";
const principles = [
  [
    Compass,
    "Thoughtful planning",
    "Start with what moves you. Shape a journey around your interests and your pace.",
  ],
  [
    Map,
    "Local perspective",
    "Look beyond the landmarks. Leave room for the everyday stories of a place.",
  ],
  [
    SlidersHorizontal,
    "Flexible experiences",
    "A quiet escape or a full itinerary. Discover a travel style that feels like you.",
  ],
  [
    HeartHandshake,
    "Personal support",
    "Share your questions and preferences, from the first idea to the finer details.",
  ],
];
const respect = [
  [
    Footprints,
    "Go a little slower",
    "Stay curious. Leave time for the unexpected.",
  ],
  [
    HandHeart,
    "Choose local",
    "Seek out local crafts, food and independent places.",
  ],
  [
    Leaf,
    "Leave a lighter footprint",
    "Carry a refillable bottle. Leave places as you found them.",
  ],
  [
    Camera,
    "Ask before you capture",
    "Respect people, sacred spaces and the stories they share.",
  ],
];
function ResourceCards({ resource, kind }) {
  if (resource.loading)
    return (
      <div
        className={
          kind === "destination" ? styles.destinationGrid : styles.packageGrid
        }
        role="status"
        aria-label="Loading journeys"
      >
        {Array.from({ length: kind === "destination" ? 4 : 3 }, (_, i) => (
          <Skeleton key={i} className={styles.cardSkeleton} />
        ))}
      </div>
    );
  if (resource.error) return <ErrorState retry={resource.retry} />;
  const items =
    kind === "destination"
      ? (resource.data || []).slice(0, 4)
      : resource.data?.items || [];
  if (!items.length) return <EmptyState />;
  return (
    <div
      className={
        kind === "destination" ? styles.destinationGrid : styles.packageGrid
      }
    >
      {items.map((item) =>
        kind === "destination" ? (
          <DestinationCard key={item.id} destination={item} />
        ) : (
          <PackageCard key={item.id} travelPackage={item} />
        ),
      )}
    </div>
  );
}
export default function Home() {
  useSeo("Discover North India", site.description);
  const destinations = useResource(getDestinations);
  const packages = useResource(getFeaturedPackages);
  const { openEnquiry } = useEnquiry();
  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-title">
        <Image
          src={site.heroImage}
          alt={site.heroImageAlt}
          eager
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
        <div className={`container ${styles.heroContent}`}>
          <p className={styles.eyebrow}>
            Many places. A thousand possibilities.
          </p>
          <h1 id="hero-title">
            Discover
            <br />
            <em>North India.</em>
          </h1>
          <p className={styles.heroDescription}>
            Mountain mornings. Timeless cities. Stories waiting around every
            corner. Find a journey that speaks to you.
          </p>
          <div className={styles.heroActions}>
            <Button to="/packages">
              Explore Packages <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <Button variant="outline" onClick={() => openEnquiry()}>
              Plan Your Trip
            </Button>
          </div>
          <p className={styles.heroCaption}>
            <span />
            Beyond the familiar. Into the extraordinary.
          </p>
        </div>
      </section>
      <div className={`container ${styles.plannerWrap}`}>
        <TripPlanner destinations={destinations} />
      </div>
      <section className="section container">
        <Reveal>
          <SectionHeading
            eyebrow="Places that stay with you"
            title="Where will your story begin?"
            description="From Himalayan foothills to Rajasthan’s warm earth, discover the many moods of North India."
          >
            <Button variant="text" to="/destinations">
              All destinations <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </SectionHeading>
        </Reveal>
        <ResourceCards resource={destinations} kind="destination" />
      </section>
      <section className={styles.principles}>
        <div className="container">
          <Reveal>
            <SectionHeading
              eyebrow="The Sudha approach"
              title="A journey, shaped around you."
              alignment="center"
              description="Good travel starts with listening. These are the ideas that guide how we think about your next escape."
            />
          </Reveal>
          <div className={styles.valueGrid}>
            {principles.map(([Icon, title, copy]) => (
              <Reveal key={title}>
                <article className={styles.value}>
                  <Icon size={28} strokeWidth={1.4} aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <Reveal>
          <SectionHeading
            eyebrow="A little inspiration"
            title="Special Journeys"
            description="Explore a selection of itineraries, and imagine the possibilities."
          >
            <Button variant="text" to="/packages">
              View All Packages <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </SectionHeading>
        </Reveal>
        <ResourceCards resource={packages} kind="package" />
      </section>
      <section className={`section ${styles.respect}`}>
        <div className={`container ${styles.respectInner}`}>
          <Reveal>
            <p className={styles.sectionEyebrow}>
              A good guest, wherever you go
            </p>
            <h2>
              Travel.
              <br />
              Explore.
              <br />
              <em>Respect.</em>
            </h2>
            <p className={styles.respectIntro}>
              The best journeys leave us changed, and the places we visit
              cherished.
            </p>
          </Reveal>
          <div className={styles.respectGrid}>
            {respect.map(([Icon, title, copy], index) => (
              <Reveal key={title}>
                <article className={styles.respectCard}>
                  <div>
                    <span>0{index + 1}</span>
                    <Icon size={23} strokeWidth={1.4} aria-hidden="true" />
                  </div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className={styles.finalCta}>
        <Image
          src={site.ctaImage}
          alt={site.ctaImageAlt}
          className={styles.ctaImage}
        />
        <div className={styles.ctaOverlay} />
        <Reveal className={`container ${styles.ctaContent}`}>
          <p className={styles.eyebrow}>Every journey starts somewhere</p>
          <h2>
            Your North India journey
            <br />
            starts with a conversation.
          </h2>
          <p>Bring your ideas. We’ll explore the possibilities together.</p>
          <div className={styles.heroActions}>
            <Button onClick={() => openEnquiry()}>
              Plan Your Trip <ArrowRight size={17} aria-hidden="true" />
            </Button>
            <Button variant="outline" to="/packages">
              Explore Packages
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
