import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FiArrowLeft, FiBox, FiMapPin, FiPackage, FiUser } from "react-icons/fi";
import client from "../../../lib/ApiClient";
import DirhamAmount from "../../../components/DirhamAmount";
import "../styles/Dashboard.css";
import "../styles/LogoutTheme.css";

const money = (value) => <DirhamAmount value={Number(value || 0)} useGrouping />;
const date = (value) => value ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function OrderDetailsDashboard() {
    const { id } = useParams(); const [order, setOrder] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
    useEffect(() => { client.get(`/orders/${id}/`).then((response) => setOrder(response.data)).catch((requestError) => setError(requestError.response?.status === 403 ? "Super Admin access required" : "We could not load this order.")).finally(() => setLoading(false)); }, [id]);
    if (loading) return <section className="detail-page"><div className="skeleton-table"><div className="skeleton-row" /><div className="skeleton-row" /><div className="skeleton-row" /></div></section>;
    if (error || !order) return <section className="detail-page"><Link className="back-link" to="/mittyco-dashboard/orders"><FiArrowLeft /> Back to orders</Link><div className="inline-error">{error || "Order not found"}</div></section>;
    const items = order.items || order.order_items || [];
    return <section className="detail-page"><Link className="back-link" to="/mittyco-dashboard/orders"><FiArrowLeft /> Back to orders</Link><div className="detail-heading"><div><p className="eyebrow">ORDER DETAILS</p><h2>{order.order_number || order.order_id || order.id}</h2><p>Created {date(order.created_at || order.date)}</p></div><button className="primary-button" onClick={() => navigate(`/mittyco-dashboard/orders?edit=${order.id}`)}><FiEdit3 /> Edit order</button></div><div className="detail-grid"><div className="detail-card"><h3><FiUser /> Customer information</h3><p className="detail-name">{order.customer_name || order.user_name || order.customer?.name || "Guest customer"}</p><p>{order.customer_email || order.user_email || order.customer?.email || "—"}</p></div><div className="detail-card"><h3><FiMapPin /> Shipping address</h3><p>{typeof order.shipping_address === "object" ? Object.values(order.shipping_address).filter(Boolean).join(", ") : order.shipping_address || "No shipping address provided"}</p></div><div className="detail-card"><h3><FiPackage /> Payment & status</h3><p><span>Payment</span><strong>{order.payment_status || "Pending"}</strong></p><p><span>Order status</span><strong>{order.status || "Pending"}</strong></p></div></div><div className="detail-card items-card"><h3><FiBox /> Order items</h3><div className="detail-items">{items.length ? items.map((item, index) => <div className="detail-item" key={item.id || index}>{item.product_image || item.image ? <img src={item.product_image || item.image} alt={item.product_name || item.name || "Product"} /> : <div className="item-placeholder"><FiBox /></div>}<div><strong>{item.product_name || item.name || "Product"}</strong><small>{[item.color, item.size || item.unit].filter(Boolean).join(" · ") || "Standard item"} · Qty {item.quantity || 1}</small></div><strong>{money((item.price || 0) * (item.quantity || 1))}</strong></div>) : <p>No item details available.</p>}</div><div className="totals"><p>Subtotal <strong>{money(order.subtotal || order.total_amount)}</strong></p><p>Discount <strong><DirhamAmount value={-Number(order.discount || 0)} useGrouping /></strong></p><p>Shipping <strong>{money(order.shipping_charge)}</strong></p><p className="total-line">Total <strong>{money(order.total_amount)}</strong></p></div></div></section>;
}
