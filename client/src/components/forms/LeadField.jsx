import styles from "./Forms.module.css";
export default function LeadField({
  prefix,
  name,
  label,
  value,
  onChange,
  error,
  multiline = false,
  ...props
}) {
  const id = `${prefix}-${name}`;
  const control = {
    id,
    name,
    value: value ?? "",
    onChange,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
    ...props,
  };
  return (
    <div className={`${styles.field} ${multiline ? styles.full : ""}`}>
      <label htmlFor={id}>{label}</label>
      {multiline ? <textarea {...control} /> : <input {...control} />}{" "}
      {error && (
        <span id={`${id}-error`} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
