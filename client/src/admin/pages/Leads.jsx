import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useResource } from "../../hooks/useResource";
import { useDialog } from "../../hooks/useDialog";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  displayDate,
  leadTypes,
  leadStatuses,
  listQuery,
  transitions,
} from "../content";
import { Field } from "../components/Fields";
import {
  Badge,
  Filters,
  Pagination,
  ResourceState,
} from "../components/Listing";
import s from "../styles/Admin.module.css";
function LeadDetail({ id, close, updated }) {
  const { request } = useAdminAuth();
  const resource = useResource(
    useCallback((signal) => request(`leads/${id}`, { signal }), [id, request]),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState(null);
  const pending = useRef(false);
  const guard = useRef({ busy, close });
  guard.current = { busy, close };
  const cancel = useCallback(() => {
    if (!guard.current.busy) guard.current.close();
  }, []);
  useEffect(
    () => () => {
      // A status refresh replaces the original table button. Restore its successor.
      requestAnimationFrame(() =>
        document.getElementById(`lead-open-${id}`)?.focus(),
      );
    },
    [id],
  );
  const ref = useDialog(true, cancel);
  const lead = resource.data;
  const save = async (event) => {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await request(`leads/${id}`, {
        method: "PATCH",
        body: { status: selected || lead.status },
      });
      setSelected(null);
      resource.retry();
      updated();
      setSuccess("Lead status updated.");
    } catch (err) {
      setError(err.message);
      if (err.status === 409) resource.retry();
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const fields = lead
    ? [
        ["Type", lead.type],
        ["Name", lead.name],
        ["Email", lead.email],
        ["Phone", lead.phone],
        ["Package", lead.package_title],
        ["Destination", lead.destination_name],
        ["Travel date", lead.travel_date && displayDate(lead.travel_date)],
        ["Travelers", lead.travelers],
        ["Status", lead.status],
        ["Created", displayDate(lead.created_at)],
        ["Message", lead.message],
      ]
    : [];
  // Whitelist user-provided trip details. Security/internal fields are never rendered.
  if (lead?.details)
    for (const [key, label] of [
      ["duration", "Duration"],
      ["budget", "Budget"],
      ["travel_type", "Travel type"],
      ["room_preference", "Room preference"],
    ])
      if (typeof lead.details[key] === "string")
        fields.push([label, lead.details[key]]);
  return (
    <dialog ref={ref} className={s.drawer} aria-labelledby="lead-title">
      <div className={s.heading}>
        <h2 id="lead-title">Lead #{id}</h2>
        <button onClick={cancel} disabled={busy} aria-label="Close lead detail">
          Close
        </button>
      </div>
      <ResourceState resource={resource} />
      {success && (
        <p role="status" className={s.success}>
          {success}
        </p>
      )}
      {lead && (
        <>
          <dl className={s.detail}>
            {fields
              .filter(
                ([, value]) =>
                  value !== null && value !== undefined && value !== "",
              )
              .map(([label, value]) => (
                <div key={label} style={{ display: "contents" }}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          <form onSubmit={save} className={s.form}>
            <Field
              label="Lead status"
              value={selected || lead.status}
              onChange={setSelected}
              options={(transitions[lead.status] || []).map((status) => [
                status,
                status,
              ])}
              disabled={busy}
              hint="Contacted leads may be closed. Closed leads may be reopened as contacted."
            />
            {error && (
              <p role="alert" className={s.error}>
                {error}
              </p>
            )}
            <button
              className={s.primary}
              disabled={busy || !selected || selected === lead.status}
            >
              {busy ? "Saving…" : "Update status"}
            </button>
          </form>
        </>
      )}
    </dialog>
  );
}
export default function Leads() {
  const { request } = useAdminAuth();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const query = listQuery(location.search, "leads");
  const queryString = query.toString();
  const resource = useResource(
    useCallback(
      (signal) => request(`leads?${queryString}`, { signal }),
      [queryString, request],
    ),
  );
  const selected = /^[1-9]\d*$/.test(params.get("lead") || "")
    ? params.get("lead")
    : null;
  const close = useCallback(
    () =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete("lead");
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  return (
    <>
      <div className={s.heading}>
        <div>
          <h1>Leads</h1>
          <p className={s.muted}>
            Enquiries and booking requests. These are not confirmed bookings.
          </p>
        </div>
        <button onClick={resource.retry}>Refresh leads</button>
      </div>
      <Filters
        query={query}
        controls={[
          {
            key: "type",
            label: "Types",
            options: leadTypes.map((type) => [type, type]),
          },
          {
            key: "status",
            label: "Statuses",
            options: leadStatuses.map((status) => [status, status]),
          },
        ]}
      />
      <ResourceState resource={resource} />
      {resource.data && (
        <>
          <div className={s.panel}>
            {resource.data.items.length ? (
              <table className={s.table}>
                <thead>
                  <tr>
                    {[
                      "Name / contact",
                      "Trip / type",
                      "Status / created",
                      "Actions",
                    ].map((label) => (
                      <th scope="col" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resource.data.items.map((lead) => (
                    <tr key={lead.id}>
                      <td data-label="Contact">
                        <div>
                          <strong>
                            {lead.name || "Newsletter subscriber"}
                          </strong>
                          {lead.email && <small>{lead.email}</small>}
                          {lead.phone && <small>{lead.phone}</small>}
                        </div>
                      </td>
                      <td data-label="Trip">
                        <div>
                          {lead.package_title || lead.destination_name || "—"}
                          <small>
                            {lead.type}
                            {lead.travel_date
                              ? ` · ${displayDate(lead.travel_date)}`
                              : ""}
                          </small>
                        </div>
                      </td>
                      <td data-label="Status">
                        <div>
                          <Badge>{lead.status}</Badge>
                          <small>{displayDate(lead.created_at)}</small>
                        </div>
                      </td>
                      <td data-label="Actions">
                        <button
                          id={`lead-open-${lead.id}`}
                          onClick={() =>
                            setParams((current) => {
                              const next = new URLSearchParams(current);
                              next.set("lead", String(lead.id));
                              return next;
                            })
                          }
                          aria-label={`View lead ${lead.name || lead.id}`}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No leads match these filters.</p>
            )}
          </div>
          <Pagination data={resource.data} query={query} />
        </>
      )}
      {selected && (
        <LeadDetail
          key={selected}
          id={selected}
          close={close}
          updated={resource.retry}
        />
      )}
    </>
  );
}
