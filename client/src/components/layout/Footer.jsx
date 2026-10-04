import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { isConfigured, popularDestinationLinks, site } from "../../config/site";
import Newsletter from "../forms/Newsletter";
import styles from "./Layout.module.css";
const columns = [
  [
    "Explore",
    [
      ["Destinations", "/destinations"],
      ["Packages", "/packages"],
      ["Experiences", "/experiences"],
      ["About", "/about"],
    ],
  ],
  [
    "Popular destinations",
    popularDestinationLinks.map(([name, slug]) => [
      name,
      `/destinations/${slug}`,
    ]),
  ],
  [
    "Support",
    [
      ["Contact", "/contact"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Cancellation", "/cancellation"],
    ],
  ],
];
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerTop}>
          <div>
            <Link to="/" className={styles.footerBrand}>
              {site.businessName}
            </Link>
            <p>
              {site.tagline}.<br />A world of stories, closer than you think.
            </p>
          </div>
          <div className={styles.newsletter}>
            <h2>Stay inspired.</h2>
            <p>Ideas for the journeys still to come.</p>
            <Newsletter />
          </div>
        </div>
        <div className={styles.footerColumns}>
          <div className={styles.contact}>
            <p>
              From the mountains to the monuments,
              <br />
              find your own way through North India.
            </p>
            {isConfigured(site.phone) && (
              <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>
                <Phone size={16} aria-hidden="true" />
                {site.phone}
              </a>
            )}
            {isConfigured(site.email) && (
              <a href={`mailto:${site.email}`}>
                <Mail size={16} aria-hidden="true" />
                {site.email}
              </a>
            )}
            {isConfigured(site.address) && (
              <p>
                <MapPin size={16} aria-hidden="true" />
                {site.address}
              </p>
            )}
            {isConfigured(site.businessHours) && <p>{site.businessHours}</p>}
          </div>
          {columns.map(([heading, links]) => (
            <div key={heading}>
              <h3>{heading}</h3>
              <ul>
                {links.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={styles.footerBottom}>
          <small>
            © {new Date().getFullYear()} {site.businessName}
          </small>
          <span>Travel thoughtfully. Take the stories home.</span>
          <div>
            {Object.entries(site.socials)
              .filter(
                ([, url]) => isConfigured(url) && /^https?:\/\//.test(url),
              )
              .map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {name}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
