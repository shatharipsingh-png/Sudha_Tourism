import { getExperiences } from "../api/api";
import { useResource } from "../hooks/useResource";
import { useSeo } from "../hooks/useSeo";
import { useEnquiry } from "../context/EnquiryContext";
import { site } from "../config/site";
import { experienceEnquiry } from "../utils/catalog";
import PageHero from "../components/common/PageHero";
import Image from "../components/common/Image";
import Button from "../components/common/Button";
import { ErrorState, EmptyState } from "../components/common/States";
import { CardSkeletons } from "../components/common/CatalogStates";
import TravelCta from "../components/common/TravelCta";
import styles from "./Editorial.module.css";
export default function Experiences() {
  useSeo(
    "Experiences",
    "Discover North India through the experiences that interest you. Explore travel ideas and plan a journey with Sudha Tourism.",
  );
  const resource = useResource(getExperiences);
  const { openEnquiry } = useEnquiry();
  return (
    <>
      <PageHero
        image={site.ctaImage}
        alt={site.ctaImageAlt}
        eyebrow="Follow your curiosity"
        title="Experience North India Your Way"
        description="Travel is as much about what you do as where you go. Make space for the experiences that matter to you."
        breadcrumbs={[{ label: "Experiences" }]}
      />
      <section className="section container">
        {resource.loading ? (
          <CardSkeletons />
        ) : resource.error ? (
          <ErrorState retry={resource.retry} />
        ) : !resource.data?.length ? (
          <EmptyState
            title="Let’s discover your kind of experience."
            description="Share your interests to begin planning."
          />
        ) : (
          <div className={styles.experiences}>
            {resource.data.map((experience, i) => (
              <article key={experience.id} className={styles.experience}>
                <Image
                  src={experience.image}
                  alt={`${experience.name} travel inspiration`}
                  className={styles.experienceImage}
                />
                <div className={styles.experienceCopy}>
                  <p className={styles.eyebrow}>
                    0{i + 1} · A different way to travel
                  </p>
                  <h2>{experience.name}</h2>
                  <p>{experience.description}</p>
                  {experience.examples?.length > 0 && (
                    <ul>
                      {experience.examples.map((example, j) => (
                        <li key={j}>{example}</li>
                      ))}
                    </ul>
                  )}
                  <Button
                    variant="text"
                    onClick={() => openEnquiry(experienceEnquiry(experience))}
                  >
                    Plan This Experience →
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <TravelCta title="Start with what moves you." />
    </>
  );
}
