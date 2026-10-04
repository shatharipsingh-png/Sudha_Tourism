import {
  Mail,
  MapPin,
  Phone,
  Clock3,
  ArrowUpRight,
  MessageCircle,
} from "lucide-react";
import { site, isConfigured } from "../config/site";
import { whatsappUrl } from "../utils/forms";
import { useSeo } from "../hooks/useSeo";
import PageHero from "../components/common/PageHero";
import ContactForm from "../components/forms/ContactForm";
import styles from "./Editorial.module.css";
export default function Contact() {
  useSeo(
    "Contact",
    `Send a message to ${site.businessName}. Share questions, travel preferences or ideas for your North India journey.`,
  );
  const whatsapp = whatsappUrl(site.whatsapp, site.businessName);
  return (
    <>
      <PageHero
        image={site.heroImage}
        alt={site.heroImageAlt}
        compact
        eyebrow="We’d love to hear your ideas"
        title="Let’s start a conversation."
        description="Tell us where you’d like to go, or simply what you’d like to feel when you get there."
        breadcrumbs={[{ label: "Contact" }]}
      />
      <section className={`section container ${styles.contactLayout}`}>
        <div className={styles.contactCopy}>
          <p className={styles.eyebrow}>Get in touch</p>
          <h2>
            A question today. <br />A journey tomorrow.
          </h2>
          <p>
            Use the form to share your travel ideas or ask about a listed
            itinerary. A message is a starting point, not a booking commitment.
          </p>
          <div className={styles.contactDetails}>
            {isConfigured(site.phone) && (
              <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>
                <Phone size={20} aria-hidden="true" />
                <div>
                  <span>Call us</span>
                  {site.phone}
                </div>
              </a>
            )}
            {isConfigured(site.email) && (
              <a href={`mailto:${site.email}`}>
                <Mail size={20} aria-hidden="true" />
                <div>
                  <span>Email</span>
                  {site.email}
                </div>
              </a>
            )}
            {isConfigured(site.address) && (
              <div>
                <MapPin size={20} aria-hidden="true" />
                <div>
                  <span>Address</span>
                  {site.address}
                </div>
              </div>
            )}
            {isConfigured(site.businessHours) && (
              <div>
                <Clock3 size={20} aria-hidden="true" />
                <div>
                  <span>Business hours</span>
                  {site.businessHours}
                </div>
              </div>
            )}
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={20} aria-hidden="true" />
                <div>
                  <span>WhatsApp</span>Start a conversation{" "}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </div>
              </a>
            )}
          </div>
          <div className={styles.socials}>
            {Object.entries(site.socials)
              .filter(
                ([, url]) => isConfigured(url) && /^https?:\/\//.test(url),
              )
              .map(([name, url]) => (
                <a
                  href={url}
                  key={name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {name}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              ))}
          </div>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
