import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import Image from "./Image";
import Breadcrumbs from "./Breadcrumbs";
import styles from "./PageHero.module.css";
export default function PageHero({
  image,
  alt = "",
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  children,
  compact = false,
}) {
  const context = useOutletContext();
  useEffect(() => {
    context?.setHero(true);
    return () => context?.setHero(false);
  }, [context]);
  return (
    <section className={`${styles.hero} ${compact ? styles.compact : ""}`}>
      <Image src={image} alt={alt} eager className={styles.image} />
      <div className={styles.overlay} />
      <div className={`container ${styles.content}`}>
        <Breadcrumbs items={breadcrumbs} />
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
        {children && <div className={styles.actions}>{children}</div>}
      </div>
    </section>
  );
}
