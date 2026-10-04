import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useResource } from "../../hooks/useResource";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Badge, ResourceState } from "../components/Listing";
import { displayDate } from "../content.js";
import s from "../styles/Admin.module.css";
export default function Dashboard() {
  const { request } = useAdminAuth();
  const resource = useResource(
    useCallback((signal) => request("stats", { signal }), [request]),
  );
  const data = resource.data;
  const stats = data
    ? [
        ["Total leads", data.totalLeads, "/admin/leads"],
        ["New leads", data.newLeads, "/admin/leads?status=new"],
        ["Contacted", data.contactedLeads, "/admin/leads?status=contacted"],
        ["Closed", data.closedLeads, "/admin/leads?status=closed"],
        ["Destinations", data.totalDestinations, "/admin/destinations"],
        ["Packages", data.totalPackages, "/admin/packages"],
        [
          "Published packages",
          data.publishedPackages,
          "/admin/packages?status=published",
        ],
        ["Experiences", data.totalExperiences, "/admin/experiences"],
      ]
    : [];
  return (
    <>
      <div className={s.heading}>
        <div>
          <h1>Dashboard</h1>
          <p className={s.muted}>An overview of your content and enquiries.</p>
        </div>
        <button onClick={resource.retry}>Refresh overview</button>
      </div>
      <ResourceState resource={resource} />
      {data && (
        <>
          <div className={s.stats}>
            {stats.map(([label, count, path]) => (
              <Link className={s.stat} key={label} to={path}>
                <span className={s.muted}>{label}</span>
                <strong>{count}</strong>
              </Link>
            ))}
          </div>
          <div className={s.grid}>
            <section className={s.panel}>
              <h2>Leads by type</h2>
              {Object.entries(data.leadsByType).map(([type, count]) => (
                <div key={type} className={s.barRow}>
                  <span>{type}</span>
                  <div className={s.bar} aria-hidden="true">
                    <span
                      style={{
                        width: `${data.totalLeads ? (count / data.totalLeads) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              ))}
            </section>
            <section className={s.panel}>
              <h2>Quick actions</h2>
              <div className={s.actions}>
                {["packages", "destinations", "experiences"].map((kind) => (
                  <Link
                    key={kind}
                    className={s.button}
                    to={`/admin/${kind}/new`}
                  >
                    Add {kind.slice(0, -1)}
                  </Link>
                ))}
                <Link className={s.button} to="/admin/leads?status=new">
                  View new leads
                </Link>
                <Link className={s.button} to="/">
                  View website
                </Link>
              </div>
            </section>
          </div>
          <section className={s.panel}>
            <div className={s.heading}>
              <h2>Recent leads</h2>
              <Link to="/admin/leads">View all leads</Link>
            </div>
            {data.recentLeads.length ? (
              <table className={s.table}>
                <thead>
                  <tr>
                    {["Name", "Type", "Status", "Created"].map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td data-label="Name">
                        <Link to={`/admin/leads?lead=${lead.id}`}>
                          {lead.name || "Newsletter subscriber"}
                        </Link>
                      </td>
                      <td data-label="Type">{lead.type}</td>
                      <td data-label="Status">
                        <Badge>{lead.status}</Badge>
                      </td>
                      <td data-label="Created">
                        {displayDate(lead.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No leads yet.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
