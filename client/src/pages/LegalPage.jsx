import { Link } from "react-router-dom";
import { useSeo } from "../hooks/useSeo";
import { legalContent } from "../config/legal";
import Breadcrumbs from "../components/common/Breadcrumbs";
import styles from "./LegalPage.module.css";
export default function LegalPage({ kind }) {
  const content = legalContent[kind];
  useSeo(content.title, content.description);
  return (
    <article className={`container ${styles.page}`}>
      <Breadcrumbs items={[{ label: content.title }]} />
      <header>
        <p className={styles.eyebrow}>Travel with clarity</p>
        <h1>{content.title}</h1>
        <p className={styles.intro}>{content.intro}</p>
      </header>
      <aside className={styles.notice} aria-label="Policy review notice">
        <strong>Policy review notice</strong>
        <p>
          This is a template for business review. The final production policy
          and business-specific terms must be approved before launch. It is not
          legal advice.
        </p>
      </aside>
      <nav aria-label={`${content.title} contents`} className={styles.contents}>
        <h2>On this page</h2>
        <ol>
          {content.sections.map(([title], i) => (
            <li key={i}>
              <a href={`#legal-section-${i + 1}`}>{title}</a>
            </li>
          ))}
        </ol>
      </nav>
      {content.sections.map(([title, text], i) => (
        <section
          id={`legal-section-${i + 1}`}
          key={i}
          className={styles.section}
        >
          <h2>{title}</h2>
          <p>{text}</p>
        </section>
      ))}
      <div className={styles.contact}>
        <h2>Have a question?</h2>
        <p>
          <Link to="/contact">Send us a message</Link> about your travel request
          or the information on this page.
        </p>
      </div>
      <nav aria-label="Related policies" className={styles.related}>
        {[
          ["privacy", "Privacy"],
          ["terms", "Terms"],
          ["cancellation", "Cancellation"],
        ]
          .filter(([key]) => key !== kind)
          .map(([key, label]) => (
            <Link key={key} to={`/${key}`}>
              {label} →
            </Link>
          ))}
      </nav>
    </article>
  );
}
