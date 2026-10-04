import { useCallback, useRef, useState } from "react";
import { formatPrice } from "../../utils/forms";
import { Link, useLocation } from "react-router-dom";
import Image from "../../components/common/Image";
import { getDestinations } from "../../api/api";
import { useResource } from "../../hooks/useResource";
import { categories } from "../../config/site";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useFeedback } from "../context/FeedbackContext";
import { labels, listQuery } from "../content";
import {
  Badge,
  Filters,
  Pagination,
  ResourceState,
} from "../components/Listing";
import ConfirmDialog from "../components/ConfirmDialog";
import s from "../styles/Admin.module.css";
export default function ContentList({ kind }) {
  const { request } = useAdminAuth();
  const notify = useFeedback();
  const location = useLocation();
  const query = listQuery(location.search, kind);
  const queryString = query.toString();
  const resource = useResource(
    useCallback(
      (signal) => request(`${kind}?${queryString}`, { signal }),
      [kind, queryString, request],
    ),
  );
  const destinations = useResource(
    useCallback(
      kind === "packages" ? (signal) => getDestinations(signal) : null,
      [kind],
    ),
  );
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const cancel = useCallback(() => {
    setDeleting(null);
    setError("");
  }, []);
  const remove = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await request(`${kind}/${deleting.id}`, { method: "DELETE" });
      cancel();
      notify(`${labels[kind]} deleted.`);
      resource.retry();
    } catch (err) {
      setError(err.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const name = (item) => item.title || item.name;
  return (
    <>
      <div className={s.heading}>
        <div>
          <h1>{labels[kind]}s</h1>
          <p className={s.muted}>Manage your website content.</p>
        </div>
        <Link className={`${s.button} ${s.primary}`} to={`/admin/${kind}/new`}>
          Add {labels[kind].toLowerCase()}
        </Link>
      </div>
      {kind === "packages" && (
        <>
          <ResourceState resource={destinations} />
          <Filters
            query={query}
            controls={[
              {
                key: "destination_id",
                label: "Destinations",
                options: (destinations.data || []).map((item) => [
                  String(item.id),
                  item.name,
                ]),
              },
              { key: "category", label: "Categories", options: categories },
              {
                key: "status",
                label: "Statuses",
                options: [
                  ["draft", "Draft"],
                  ["published", "Published"],
                ],
              },
            ]}
          />
        </>
      )}
      <ResourceState resource={resource} />
      {resource.data && (
        <>
          <div className={s.panel}>
            {resource.data.items.length ? (
              <table className={s.table}>
                <thead>
                  <tr>
                    {[
                      "Content",
                      ...(kind === "destinations"
                        ? ["Region", "Visibility / order"]
                        : kind === "packages"
                          ? [
                              "Destination / category",
                              "Duration / price",
                              "Status",
                            ]
                          : ["Sort"]),
                      "Actions",
                    ].map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resource.data.items.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Content">
                        <div className={s.identity}>
                          <div className={s.thumb}>
                            <Image src={item.image} alt="" />
                          </div>
                          <div>
                            <strong>{name(item)}</strong>
                            <small>{item.slug}</small>
                          </div>
                        </div>
                      </td>
                      {kind === "destinations" ? (
                        <>
                          <td data-label="Region">{item.region}</td>
                          <td data-label="Visibility">
                            <div>
                              {item.featured ? "Featured" : "Standard"}
                              <small>Sort: {item.sort}</small>
                            </div>
                          </td>
                        </>
                      ) : kind === "packages" ? (
                        <>
                          <td data-label="Destination">
                            <div>
                              {destinations.data?.find(
                                (destination) =>
                                  destination.id === item.destination_id,
                              )?.name || `Destination #${item.destination_id}`}
                              <small>{item.category}</small>
                            </div>
                          </td>
                          <td data-label="Price">
                            <div>
                              {item.duration_days} days
                              <small>{formatPrice(item.price)}</small>
                            </div>
                          </td>
                          <td data-label="Status">
                            <div>
                              <Badge>{item.status}</Badge>
                              <small>
                                {[
                                  item.featured && "Featured",
                                  item.best_seller && "Best seller",
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </small>
                            </div>
                          </td>
                        </>
                      ) : (
                        <td data-label="Sort">{item.sort}</td>
                      )}
                      <td data-label="Actions">
                        <div className={s.actions}>
                          <Link
                            className={s.button}
                            to={`/admin/${kind}/${item.id}/edit`}
                            aria-label={`Edit ${name(item)}`}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              setDeleting(item);
                              setError("");
                            }}
                            aria-label={`Delete ${name(item)}`}
                          >
                            Delete
                          </button>
                          {kind !== "experiences" &&
                            (kind !== "packages" ||
                              item.status === "published") && (
                              <Link
                                to={`/${kind}/${item.slug}`}
                                aria-label={`View ${name(item)} public page`}
                              >
                                View public
                              </Link>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>
                No content matches this page.{" "}
                <Link to={`/admin/${kind}`}>Return to first page</Link>
              </p>
            )}
          </div>
          <Pagination data={resource.data} query={query} />
        </>
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete “${deleting ? name(deleting) : ""}”?`}
        description="This cannot be undone. Packages and historical leads may prevent deletion. Referenced content and leads will be preserved."
        busy={busy}
        error={error}
        onCancel={cancel}
        onConfirm={remove}
      />
    </>
  );
}
