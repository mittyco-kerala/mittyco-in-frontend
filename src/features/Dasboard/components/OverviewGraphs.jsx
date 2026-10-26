import { FiBarChart2, FiLayers } from "react-icons/fi";
import { Skeleton } from "./AdminPrimitives";
import "../styles/OverviewGraphs.css";

// Visible labels and values convey the data without relying on color or hover.
function CountGraph({ title, description, rows, loading, emptyMessage, icon }) {
    const maximum = Math.max(1, ...rows.map((row) => row.count ?? 0));
    const empty = rows.every((row) => row.count === 0);
    return <figure className="admin-panel overview-count-graph" aria-busy={loading}>
        <figcaption className="admin-panel-heading">
            <div><h3>{title}</h3><p>{description}</p></div>
            {icon}
        </figcaption>
        <ul className="overview-graph-rows" aria-label={title}>
            {rows.map(({ label, count, color }) => <li key={label}>
                <div className="overview-graph-label">
                    <span><span className="overview-graph-dot" style={{ backgroundColor: color }} aria-hidden="true" />{label}</span>
                    {loading ? <Skeleton className="overview-skeleton-count" /> : <strong>{count === null ? "Unavailable" : count.toLocaleString()}</strong>}
                </div>
                {loading ? <Skeleton className="overview-graph-loading" /> : <div className="overview-graph-track" aria-hidden="true">
                    <div className="overview-graph-fill" style={{ width: `${((count ?? 0) / maximum) * 100}%`, backgroundColor: color }} />
                </div>}
            </li>)}
        </ul>
        <p className="overview-graph-note">{loading ? "Loading summary…" : empty ? emptyMessage : "Counts from your store. Longer bars mean more records."}</p>
    </figure>;
}

export default function OverviewGraphs({ statusRows, catalogRows, loading }) {
    return <section className="overview-graphs" aria-label="Store summary graphs">
        <CountGraph title="Orders by status" description="See which orders need attention." rows={statusRows} loading={loading} emptyMessage="No orders yet. Your order activity will appear here." icon={<FiBarChart2 aria-hidden="true" />} />
        <CountGraph title="Catalog at a glance" description="A quick view of what is in your store." rows={catalogRows} loading={loading} emptyMessage="Your catalog is empty. Add products to get started." icon={<FiLayers aria-hidden="true" />} />
    </section>;
}
