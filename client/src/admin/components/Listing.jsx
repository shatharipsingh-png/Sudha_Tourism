import { useSearchParams } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import { Field } from "./Fields";
import s from "../styles/Admin.module.css";
export function Filters({ controls, query }) {
  const [, setSearch] = useSearchParams();
  const latestQuery = useRef(query);
  const queryString = query.toString();
  useLayoutEffect(() => {
    latestQuery.current = new URLSearchParams(queryString);
  }, [queryString]);
  return (
    <div className={s.filters}>
      {controls.map((control) => (
        <Field
          key={control.key}
          label={control.label}
          value={query.get(control.key) || ""}
          options={[
            ["", `All ${control.label.toLowerCase()}`],
            ...control.options,
          ]}
          onChange={(value) => {
            // Preserve the preceding selection even before route rendering commits.
            const next = new URLSearchParams(latestQuery.current);
            next.delete("limit");
            next.delete("page");
            if (value) next.set(control.key, value);
            else next.delete(control.key);
            latestQuery.current = next;
            setSearch(next);
          }}
        />
      ))}
      <button
        type="button"
        onClick={() => {
          latestQuery.current = new URLSearchParams();
          setSearch({});
        }}
      >
        Clear filters
      </button>
    </div>
  );
}
export function Pagination({ data, query }) {
  const [, setSearch] = useSearchParams();
  const go = (page) => {
    const next = new URLSearchParams(query);
    next.delete("limit");
    next.set("page", String(page));
    setSearch(next);
  };
  return (
    <nav className={s.pagination} aria-label="Pagination">
      <span>
        {data.total} records · Page {data.page} of{" "}
        {Math.max(1, data.totalPages)}
      </span>
      <div className={s.actions}>
        <button disabled={data.page <= 1} onClick={() => go(data.page - 1)}>
          Previous
        </button>
        <button
          disabled={data.page >= data.totalPages}
          onClick={() => go(data.page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
export function ResourceState({ resource }) {
  if (resource.loading)
    return (
      <p role="status" className={s.loading}>
        Loading records…
      </p>
    );
  if (resource.error)
    return (
      <div role="alert" className={s.error}>
        {resource.error.message}{" "}
        <button onClick={resource.retry}>Try again</button>
      </div>
    );
  return null;
}
export function Badge({ children }) {
  return (
    <span className={s.badge} data-status={children}>
      {children}
    </span>
  );
}
