import { Compass, Leaf, HeartHandshake, SlidersHorizontal } from "lucide-react";
import { site, isConfigured } from "../config/site";
import { useSeo } from "../hooks/useSeo";
import PageHero from "../components/common/PageHero";
import Image from "../components/common/Image";
import SectionHeading from "../components/common/SectionHeading";
import TravelCta from "../components/common/TravelCta";
import styles from "./Editorial.module.css";
const values = [
  [
    Compass,
    "Thoughtful planning",
    "A good route leaves room for your interests, your pace and the details that make travel easier.",
  ],
  [
    Leaf,
    "Respect for place",
    "Travel with curiosity and care for the people, cultures and landscapes you encounter.",
  ],
  [
    HeartHandshake,
    "Human support",
    "Start with a conversation. Ask questions, share ideas and make decisions with clear information.",
  ],
  [
    SlidersHorizontal,
    "Flexible travel",
    "A journey can be adventurous, restful, cultural or a little of each. Let your preferences lead.",
  ],
];
export default function About() {
  useSeo(
    "About",
    `Meet the travel philosophy behind ${site.businessName}: thoughtful planning, respect for place and journeys around North India.`,
  );
  const stats = [
    ["yearsInBusiness", "Years in travel"],
    ["travelerCount", "Travelers"],
    ["destinationsCovered", "Destinations"],
  ].filter(([key]) => isConfigured(site.stats[key]));
  return (
    <>
      <PageHero
        image={site.heroImage}
        alt={site.heroImageAlt}
        eyebrow="The way we see travel"
        title="Places connect us. Journeys stay with us."
        description={`At ${site.businessName}, the starting point is simple: a journey should feel like your own.`}
        breadcrumbs={[{ label: "About" }]}
      />
      <section className={`section container ${styles.aboutStory}`}>
        <div>
          <p className={styles.eyebrow}>Who we are</p>
          <h2>
            North India.
            <br />
            Your perspective.
          </h2>
          <p>
            {site.businessName} is a travel-planning agency focused on North
            India. This website brings together destinations, itinerary ideas
            and experiences to help you explore the possibilities.
          </p>
          <p>
            Whether you’re drawn to a mountain valley or a historic city, tell
            us what you have in mind. Your interests, practical needs and
            preferred pace are a useful place to begin.
          </p>
        </div>
        <Image
          src={site.ctaImage}
          alt={site.ctaImageAlt}
          className={styles.aboutImage}
        />
      </section>
      <section className={styles.mission}>
        <div className="container">
          <p className={styles.eyebrow}>Our mission</p>
          <h2>
            Make room for discovery.
            <br />
            Make planning feel personal.
          </h2>
          <p>
            Our aim is to help you find a considered route through North India,
            with clear conversations and respect for the places along the way.
          </p>
        </div>
      </section>
      <section className="section container">
        <SectionHeading
          eyebrow="What guides us"
          title="Small principles. Meaningful journeys."
        />
        <div className={styles.values}>
          {values.map(([Icon, title, copy]) => (
            <article key={title}>
              <Icon size={27} strokeWidth={1.5} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={`section ${styles.approach}`}>
        <div className="container">
          <SectionHeading
            eyebrow="From an idea to an itinerary"
            title="Begin with a conversation."
          />
          <ol className={styles.steps}>
            {[
              [
                "Share your interests",
                "Tell us about your destination ideas, dates, travel style and budget preferences.",
              ],
              [
                "Explore a route",
                "Use our listed journeys as a starting point and discuss the details that matter to you.",
              ],
              [
                "Agree the arrangements",
                "Confirm availability, pricing and applicable terms before making a commitment.",
              ],
            ].map(([title, copy], i) => (
              <li key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      {stats.length > 0 && (
        <section
          className={`section container ${styles.stats}`}
          aria-label="About the business"
        >
          {stats.map(([key, label]) => (
            <div key={key}>
              <strong>{site.stats[key]}</strong>
              <p>{label}</p>
            </div>
          ))}
        </section>
      )}
      <TravelCta title="Let’s find your next chapter." />
    </>
  );
}
