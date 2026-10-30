import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiPrinter } from "react-icons/fi";
import client from "../../../lib/ApiClient";
import Code128Barcode from "../../../components/Code128Barcode";
import "../styles/PackagingSlip.css";

const formatDate = (value) => value
    ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "—";

const addressLines = (order) => [
    order.address_name,
    order.address_line,
    order.city,
    order.postcode,
    order.country,
].filter(Boolean);

export default function PackagingSlip() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const requestedIds = searchParams.get("order_ids") || id || "";
    const orderKey = requestedIds.split(",").map((value) => Number(value.trim())).filter(Number.isInteger).filter((value) => value > 0).join(",");
    const [slip, setSlip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadSlip = useCallback(async () => {
        if (!orderKey) {
            setError("At least one order is required to create a packaging slip.");
            setLoading(false);
            return;
        }
        try {
            setError("");
            const response = await client.post("/admin/packaging-slips/", {
                order_ids: orderKey.split(",").map(Number),
            });
            setSlip(response.data);
        } catch (requestError) {
            setError(requestError.response?.status === 403
                ? "Super Admin access required."
                : requestError.response?.data?.detail || "Unable to generate the packaging slip.");
        } finally {
            setLoading(false);
        }
    }, [orderKey]);

    useEffect(() => {
        // The request updates state after the external API call.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadSlip();
    }, [loadSlip]);

    if (loading) return <section className="packaging-page"><div className="packaging-state">Generating packaging slip…</div></section>;
    if (error || !slip) return <section className="packaging-page"><div className="packaging-state packaging-error">{error || "Packaging slip not found."}</div></section>;

    const items = slip.items || [];
    const orders = slip.orders || [];
    const totalQuantity = items.reduce((total, item) => total + Number(item.quantity || 0), 0);

    return (
        <section className="packaging-page">
            <div className="packaging-actions no-print">
                <button type="button" className="packaging-back-button" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Back to orders
                </button>
                <button type="button" className="packaging-print-button" onClick={() => window.print()}>
                    <FiPrinter /> Print packaging slip
                </button>
            </div>

            <article className="packaging-sheet">
                <header className="packaging-header">
                    <div>
                        <p className="packaging-kicker">MITTYCO FULFILMENT</p>
                        <h1>Packaging Slip</h1>
                        <p className="packaging-subtitle">Pick, pack, and dispatch every item in this shipment.</p>
                    </div>
                    <Code128Barcode value={slip.slip_number} label={slip.slip_number} />
                </header>

                <div className="packaging-meta-grid">
                    <div><span>Slip number</span><strong>{slip.slip_number}</strong></div>
                    <div><span>Generated</span><strong>{formatDate(slip.created_at)}</strong></div>
                    <div><span>Orders / items</span><strong>{orders.length} / {totalQuantity}</strong></div>
                </div>

                <section className="packaging-orders">
                    <div className="packaging-section-heading">
                        <div><p className="packaging-kicker">SHIPMENTS</p><h2>Order destinations</h2></div>
                        <span>{orders.length} order{orders.length === 1 ? "" : "s"}</span>
                    </div>
                    <div className="packaging-order-grid">
                        {orders.map((order) => (
                            <section className="packaging-order-card" key={order.id}>
                                <div className="packaging-order-card-heading"><strong>{order.order_number}</strong><span>{order.customer_name || "Customer"}</span></div>
                                {order.customer_email && <span>{order.customer_email}</span>}
                                {order.address_phone && <span>{order.address_phone}</span>}
                                {addressLines(order).map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}
                            </section>
                        ))}
                    </div>
                </section>

                <section className="packaging-items">
                    <div className="packaging-section-heading">
                        <div><p className="packaging-kicker">PICK LIST</p><h2>Products and individual barcodes</h2></div>
                        <span>{items.length} product line{items.length === 1 ? "" : "s"}</span>
                    </div>
                    {items.length ? (
                        <table>
                            <thead><tr><th aria-label="Picked" /><th>Product</th><th>Order</th><th>Variant / unit</th><th>Qty</th><th>Barcode</th></tr></thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td><span className="packaging-checkbox" aria-label={`Mark ${item.product_name || "product"} picked`} /></td>
                                        <td><strong>{item.product_name || "Product"}</strong>{item.sku && <small className="packaging-sku">SKU: {item.sku}</small>}</td>
                                        <td>{item.order_number}</td>
                                        <td>{[item.color, item.unit_type && item.size ? `${item.unit_type}: ${item.size}` : item.size].filter(Boolean).join(" · ") || "Standard"}</td>
                                        <td><strong>{item.quantity || 0}</strong></td>
                                        <td><Code128Barcode value={item.barcode} label={item.barcode} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p className="packaging-empty">No item lines found for these orders.</p>}
                </section>

                <footer className="packaging-footer">
                    <span>Scan each item barcode and verify the order number before dispatch.</span>
                    <strong>{slip.slip_number}</strong>
                </footer>
            </article>
        </section>
    );
}
