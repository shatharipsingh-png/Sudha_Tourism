import { useCallback, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock3, MapPin, Star, Check, X, ArrowRight } from "lucide-react";
import { getPackage } from "../api/api";
import { useResource } from "../hooks/useResource";
import { useSeo } from "../hooks/useSeo";
import { useEnquiry } from "../context/EnquiryContext";
import { formatPrice } from "../utils/forms";
import PageHero from "../components/common/PageHero";
import Button from "../components/common/Button";
import Image from "../components/common/Image";
import SectionHeading from "../components/common/SectionHeading";
import Itinerary from "../components/common/Itinerary";
import { DetailState } from "../components/common/CatalogStates";
import PackageCard from "../components/cards/PackageCard";
import BookingModal from "../components/forms/BookingModal";
import styles from "./Detail.module.css";
import catalog from "./Catalog.module.css";
export default function PackageDetail() {
  const { slug } = useParams();
  const loader = useCallback((signal) => getPackage(slug, signal), [slug]);
  const resource = useResource(loader);
  const pkg = resource.data;
  useSeo(
    resource.error?.status === 404
      ? "Page not found"
      : pkg?.title || "Tour Package",
    pkg?.short_desc || "Explore North India tour packages with Sudha Tourism.",
  );
  const { openEnquiry } = useEnquiry();
  const [booking, setBooking] = useState(false);
  const closeBooking = useCallback(() => setBooking(false), []);
  if (!pkg || resource.loading || resource.error)
    return <DetailState resource={resource} />;
  const context = {
    packageId: pkg.id,
    packageTitle: pkg.title,
    destinationId: pkg.destination_id,
    destinationName: pkg.destination?.name,
  };
  const priceAvailable =
    pkg.price !== null &&
    pkg.price !== undefined &&
    pkg.price !== "" &&
    Number.isFinite(Number(pkg.price));
  const gallery = [...new Set(pkg.gallery || [])].filter(
    (url) => url !== pkg.image,
  );
  return (
    <>
      <PageHero
        image={pkg.image}
        alt={pkg.title}
        eyebrow={pkg.destination?.name}
        title={pkg.title}
        description={pkg.route}
        breadcrumbs={[
          { label: "Packages", to: "/packages" },
          { label: pkg.title },
        ]}
      >
        <div className={styles.heroMeta}>
          <span>
            <Clock3 size={16} aria-hidden="true" />
            {pkg.duration_days} days
          </span>
          <span>
            <MapPin size={16} aria-hidden="true" />
            {pkg.category}
          </span>
          {pkg.rating != null && Number(pkg.rating) > 0 && (
            <span>
              <Star size={15} aria-hidden="true" />
              Rating {pkg.rating} / 5
            </span>
          )}
          {Boolean(pkg.best_seller) && (
            <span className={styles.heroBadge}>Best seller</span>
          )}
        </div>
      </PageHero>
      <div className={`section container ${styles.packageLayout}`}>
        <div>
          <section className={styles.packageSection}>
            <p className={styles.eyebrow}>The journey at a glance</p>
            <h2>Overview</h2>
            <p>{pkg.short_desc}</p>
            {pkg.destination && (
              <p>
                Explore more of{" "}
                <Link to={`/destinations/${pkg.destination.slug}`}>
                  {pkg.destination.name}{" "}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                .
              </p>
            )}
          </section>
          {pkg.highlights?.length > 0 && (
            <section className={styles.packageSection}>
              <h2>Highlights</h2>
              <ul className={styles.highlights}>
                {pkg.highlights.map((item, i) => (
                  <li key={i}>
                    <Check size={17} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {pkg.itinerary?.length > 0 && (
            <section className={styles.packageSection}>
              <p className={styles.eyebrow}>One day at a time</p>
              <h2>Your itinerary</h2>
              <Itinerary key={pkg.id} days={pkg.itinerary} />
            </section>
          )}
          {(pkg.inclusions?.length > 0 || pkg.exclusions?.length > 0) && (
            <section className={styles.packageSection}>
              <h2>What’s part of the journey</h2>
              <div className={styles.inclusionGrid}>
                {[
                  ["Included", pkg.inclusions, Check, styles.included],
                  ["Not included", pkg.exclusions, X, styles.excluded],
                ].map(
                  ([title, items, Icon, className]) =>
                    items?.length > 0 && (
                      <div key={title}>
                        <h3>{title}</h3>
                        <ul className={`${styles.checkList} ${className}`}>
                          {items.map((item, i) => (
                            <li key={i}>
                              <Icon size={16} aria-hidden="true" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ),
                )}
              </div>
            </section>
          )}
          {(pkg.info?.important?.length > 0 || pkg.info?.tips?.length > 0) && (
            <section className={styles.packageSection}>
              <h2>Before you travel</h2>
              {[
                ["Important information", pkg.info.important],
                ["Travel tips", pkg.info.tips],
              ].map(
                ([title, items]) =>
                  items?.length > 0 && (
                    <div className={styles.infoBlock} key={title}>
                      <h3>{title}</h3>
                      <ul>
                        {items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ),
              )}
            </section>
          )}
          {gallery.length > 0 && (
            <section className={styles.packageSection}>
              <h2>A glimpse of the journey</h2>
              <div className={styles.gallery}>
                {gallery.map((url, i) => (
                  <Image
                    key={url}
                    src={url}
                    alt={`${pkg.title} — gallery photograph ${i + 1}`}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className={styles.actionCard} aria-label="Plan this package">
          <p className={styles.priceLabel}>Journey from</p>
          <strong className={styles.price}>
            {priceAvailable ? formatPrice(pkg.price) : "Contact for pricing"}
          </strong>
          {priceAvailable && (
            <p className={styles.priceLabel}>per person · INR</p>
          )}
          <hr />
          <dl>
            <dt>Duration</dt>
            <dd>{pkg.duration_days} days</dd>
            <dt>Travel style</dt>
            <dd>{pkg.category}</dd>
            {pkg.destination && (
              <>
                <dt>Destination</dt>
                <dd>{pkg.destination.name}</dd>
              </>
            )}
          </dl>
          <Button onClick={() => setBooking(true)}>Request a Booking</Button>
          <Button variant="outline" onClick={() => openEnquiry(context)}>
            Enquire Now
          </Button>
          <p>
            Submitting a request does not confirm availability, price or a
            booking. Final arrangements are agreed separately.
          </p>
          <Link to="/cancellation" className={styles.priceLabel}>
            Cancellation information
          </Link>
        </aside>
      </div>
      {pkg.related?.length > 0 && (
        <section className={`section ${styles.soft}`}>
          <div className="container">
            <SectionHeading
              eyebrow="Keep exploring"
              title="Other journeys to consider"
            />
            <div className={catalog.cardGrid}>
              {pkg.related.slice(0, 3).map((related) => (
                <PackageCard key={related.id} travelPackage={related} />
              ))}
            </div>
          </div>
        </section>
      )}
      <BookingModal
        key={pkg.id}
        open={booking}
        onClose={closeBooking}
        travelPackage={pkg}
      />
    </>
  );
}
