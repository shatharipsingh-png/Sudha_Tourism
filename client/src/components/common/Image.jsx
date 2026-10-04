import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import styles from "./Image.module.css";
export default function Image({ src, alt, className = "", eager = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed || !src)
    return (
      <div
        role="img"
        aria-label={`${alt} — image unavailable`}
        className={`${styles.fallback} ${className}`}
      >
        <ImageOff size={30} aria-hidden="true" />
        <span>Image unavailable</span>
      </div>
    );
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
