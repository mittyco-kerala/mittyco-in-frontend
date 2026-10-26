export default function ProductCouponInput({ value, onChange, onApply, applying = false, locked = false, error = "" }) {
    return <div className="coupon-section" style={{ margin: "10px 0 20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #ddd" }}>
        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>Apply Discount Coupon:</div>
        <div className="product-coupon-controls">
            <input type="text" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Enter coupon / redemption code" aria-label="Coupon or redemption code" style={{ flex: 1, padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px" }} />
            <button type="button" onClick={onApply} disabled={applying || locked} style={{ padding: "8px 16px", backgroundColor: "#1F5B3E", color: "#fff", border: "none", borderRadius: "4px", cursor: applying || locked ? "not-allowed" : "pointer", opacity: applying || locked ? 0.65 : 1 }}>{applying ? "Applying..." : "Apply Coupon"}</button>
        </div>
        {error && <div style={{ color: "red", fontSize: "13px", marginTop: "8px" }} role="alert">{error}</div>}
    </div>;
}
