import { Link } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import styles from "./Button.module.css";
export default function Button({
  children,
  variant = "primary",
  to,
  href,
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  const classes = `${styles.button} ${styles[variant]} ${className}`;
  const content = (
    <>
      {loading && (
        <LoaderCircle size={18} className={styles.spinner} aria-hidden="true" />
      )}
      {children}
    </>
  );
  if (to && !disabled && !loading)
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  if (href && !disabled && !loading)
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {content}
      </a>
    );
  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
}
