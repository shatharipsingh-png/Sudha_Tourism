import { useCallback, useEffect, useRef } from "react";
import { useSearchParams, useNavigationType } from "react-router-dom";
import { getDestinations, getPackages } from "../api/api";
import { useResource } from "../hooks/useResource";
import { useSeo } from "../hooks/useSeo";
import { site, categories, durations } from "../config/site";
import {
  readPackageQuery,
  updatePackageQuery,
  paginationPages,
} from "../utils/catalog";
import PageHero from "../components/common/PageHero";
import PackageCard from "../components/cards/PackageCard";
import { ErrorState } from "../components/common/States";
import {
  CardSkeletons,
  CustomTripEmpty,
} from "../components/common/CatalogStates";
import styles from "./Catalog.module.css";
export default function Packages() {
  useSeo(
    "Tour Packages",
    "Browse North India tour packages by destination, travel style, duration and budget. Find a journey to make your own.",
  );
  const [params, setParams] = useSearchParams();
  const search = params.toString();
  const { values, errors, query, page } = readPackageQuery(search);
  const invalid = Object.keys(errors).length > 0;
  const loader = useCallback((signal) => getPackages(query, signal), [query]);
  const resource = useResource(invalid ? null : loader);
  const destinations = useResource(getDestinations);
  const previousPage = useRef(page);
  const requestedPageFocus = useRef(false);
  const pendingPageFocus = useRef(null);
  const navigationType = useNavigationType();
  useEffect(() => {
    if (
      previousPage.current !== page &&
      (requestedPageFocus.current || navigationType === "POP")
    ) {
      pendingPageFocus.current = page;
      document
        .getElementById("package-results")
        ?.scrollIntoView({ block: "start", behavior: "instant" });
    }
    requestedPageFocus.current = false;
    previousPage.current = page;
  }, [page, navigationType]);
  useEffect(() => {
    if (
      !resource.loading &&
      resource.data &&
      pendingPageFocus.current === page
    ) {
      document
        .getElementById("package-results-heading")
        ?.focus({ preventScroll: true });
      pendingPageFocus.current = null;
    }
  }, [resource.loading, resource.data, page]);
  function update(key, value) {
    requestedPageFocus.current = key === "page";
    setParams(updatePackageQuery(search, { [key]: value }));
  }
  function clear() {
    requestedPageFocus.current = false;
    setParams({});
  }
  function field(key, label, type = "select", options = []) {
    return (
      <div className={styles.field}>
        <label htmlFor={`filter-${key}`}>{label}</label>
        {type === "number" ? (
          <input
            id={`filter-${key}`}
            type="number"
            min="0"
            max="4294967295"
            step="1"
            inputMode="numeric"
            value={values[key]}
            onChange={(event) => update(key, event.target.value)}
            aria-invalid={Boolean(errors[key])}
            aria-describedby={errors[key] ? `filter-error-${key}` : undefined}
          />
        ) : (
          <select
            id={`filter-${key}`}
            value={values[key]}
            onChange={(event) => update(key, event.target.value)}
            disabled={key === "destination" && destinations.loading}
            aria-invalid={Boolean(errors[key])}
            aria-describedby={errors[key] ? `filter-error-${key}` : undefined}
          >
            <option value="">
              All {key === "destination" ? "destinations" : "durations"}
            </option>
            {values[key] &&
              !options.some(([value]) => value === values[key]) && (
                <option value={values[key]}>Selection: {values[key]}</option>
              )}
            {options.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        )}
        {errors[key] && (
          <p id={`filter-error-${key}`} className={styles.feedback}>
            {errors[key]}
          </p>
        )}
      </div>
    );
  }
  const data = resource.data;
  return (
    <>
      <PageHero
        image={site.ctaImage}
        alt={site.ctaImageAlt}
        compact
        eyebrow="Find your kind of journey"
        title="Journeys Designed Around North India"
        description="Choose a destination, follow a curiosity, or leave a little room for something unexpected."
        breadcrumbs={[{ label: "Packages" }]}
      />
      <section className="section container">
        <div className={styles.chips} role="group" aria-label="Filter packages by category">
          {[["", "All"], ...categories].map(([value, label]) => (
            <button
              className={styles.chip}
              key={value}
              aria-pressed={values.category === value}
              onClick={() => update("category", value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          className={styles.filters}
          role="group"
          aria-label="Journey filters"
        >
          <div className={styles.filterFields}>
            {field(
              "destination",
              "Destination",
              "select",
              (destinations.data || []).map((d) => [d.slug, d.name]),
            )}
            {field("duration", "Duration", "select", durations)}
            {field("minPrice", "Minimum price (INR)", "number")}
            {field("maxPrice", "Maximum price (INR)", "number")}
          </div>
          <div className={styles.filterCaption}>
            <p>
              Prices shown in Indian rupees. Availability and final arrangements
              are confirmed separately.
            </p>
            <button className={styles.textButton} onClick={clear}>
              Clear Filters
            </button>
          </div>
          {destinations.error && (
            <p className={styles.feedback}>
              Destination choices couldn’t load.{" "}
              <button
                className={styles.textButton}
                onClick={destinations.retry}
              >
                Retry choices
              </button>
            </p>
          )}
          {["category", "page", "limit", "featured", "best_seller"]
            .filter((key) => errors[key])
            .map((key) => (
              <p key={key} role="alert" className={styles.feedback}>
                {errors[key]}
              </p>
            ))}
        </div>
        <div id="package-results">
          {invalid ? (
            <CustomTripEmpty
              title="Let’s adjust these filters."
              description="Check the highlighted fields, or start again with all journeys."
              clear={clear}
            />
          ) : resource.loading ? (
            <CardSkeletons />
          ) : resource.error ? (
            <ErrorState retry={resource.retry} />
          ) : (
            <>
              <div className={styles.resultsHeader}>
                <h2
                  id="package-results-heading"
                  tabIndex={-1}
                  aria-live="polite"
                >
                  {data?.total || 0}{" "}
                  {data?.total === 1 ? "journey" : "journeys"} found
                </h2>
                <span className={styles.count}>
                  Find a route. Make it yours.
                </span>
              </div>
              {data?.items?.length ? (
                <>
                  <div className={styles.cardGrid}>
                    {data.items.map((pkg) => (
                      <PackageCard key={pkg.id} travelPackage={pkg} />
                    ))}
                  </div>
                  {data.totalPages > 1 && (
                    <>
                      <nav
                        aria-label="Package pagination"
                        className={styles.pagination}
                      >
                        <button
                          disabled={page <= 1}
                          onClick={() => update("page", page - 1)}
                        >
                          Previous
                        </button>
                        {paginationPages(page, data.totalPages).map(
                          (number, i, array) => (
                            <span key={number}>
                              {i > 0 && number - array[i - 1] > 1 && (
                                <span aria-hidden="true"> … </span>
                              )}
                              <button
                                aria-label={`Page ${number}`}
                                aria-current={
                                  page === number ? "page" : undefined
                                }
                                onClick={() => update("page", number)}
                              >
                                {number}
                              </button>
                            </span>
                          ),
                        )}
                        <button
                          disabled={page >= data.totalPages}
                          onClick={() => update("page", page + 1)}
                        >
                          Next
                        </button>
                      </nav>
                      <p className={styles.pageMeta}>
                        Page {page} of {data.totalPages}
                      </p>
                    </>
                  )}
                </>
              ) : (
                <CustomTripEmpty
                  title={
                    data?.total
                      ? "This page has no journeys."
                      : "No journeys match these filters."
                  }
                  description="Try a different combination or share your ideas for a custom trip."
                  clear={clear}
                />
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
