import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import styles from "./PageHero.module.css";
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <ol>
        {[{ label: "Home", to: "/" }, ...items].map((item, index) => (
          <li key={index}>
            {index > 0 && <ChevronRight size={12} aria-hidden="true" />}
            {item.to && index < items.length ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current={index === items.length ? "page" : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
