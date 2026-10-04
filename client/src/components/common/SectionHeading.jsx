import styles from "./SectionHeading.module.css";
export default function SectionHeading({
  eyebrow,
  title,
  description,
  alignment = "left",
  children,
}) {
  return (
    <div
      className={`${styles.heading} ${alignment === "center" ? styles.center : ""}`}
    >
      <div>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {children}
    </div>
  );
}
