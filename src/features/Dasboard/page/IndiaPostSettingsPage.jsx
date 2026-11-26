import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FiAlertCircle, FiCheckCircle, FiRefreshCw, FiSave, FiShield, FiTruck, FiWifi } from "react-icons/fi";
import { ErrorState, LoadingState, PageHeader } from "../components/AdminPrimitives";
import {
    getErrorMessage,
    getIndiaPostSettings,
    testIndiaPostConnection,
    testIndiaPostTariff,
    updateIndiaPostSettings,
} from "../services/adminApi";
import "../styles/IndiaPostSettings.css";

const initialSettings = {
    fulfillment_provider: "prodinent",
    direct_tariff_enabled: false,
    fulfillment_enabled: false,
    live_booking_enabled: false,
    auto_booking_enabled: false,
    origin_pincode: "",
    origin_state: "",
    origin_latitude: "",
    origin_longitude: "",
    free_delivery_radius_km: "5",
    default_item_weight_grams: "500",
    tariff_service: "business_parcel",
    parcel_length_cm: "",
    parcel_width_cm: "",
    parcel_height_cm: "",
    shape_of_article: "NROL",
    bulk_customer_id: "",
    sender_name: "",
    sender_company: "",
    sender_address_line1: "",
    sender_address_line2: "",
    sender_address_line3: "",
    sender_city: "",
    sender_state: "",
    sender_pincode: "",
    sender_mobile: "",
    label_transmission_mode: "S",
};

const readinessLabels = [
    ["api_credentials_configured", "India Post API credentials are on the backend"],
    ["tariff_ready", "Business Parcel tariff settings are complete"],
    ["five_km_delivery_ready", "Store GPS coordinates are set for the 5 km free-delivery rule"],
    ["sender_profile_ready", "Sender details are complete"],
    ["bulk_customer_id_ready", "10-digit DOP bulk customer ID is set"],
    ["allocated_series_and_office_ready", "Active DOP barcode range and approved booking office are set"],
    ["product_weights_ready", "Every product variant/unit has a packed shipping weight"],
    ["booking_ready", "Manual India Post booking is ready"],
];

function Field({ label, name, value, onChange, hint, ...props }) {
    return <label className="india-post-settings-field">
        <span>{label}</span>
        <input name={name} value={value ?? ""} onChange={onChange} {...props} />
        {hint && <small>{hint}</small>}
    </label>;
}

function SwitchRow({ name, title, description, checked, onChange, disabled = false, badge }) {
    return <label className={`india-post-settings-switch ${disabled ? "is-disabled" : ""}`}>
        <span className="india-post-settings-switch-copy"><strong>{title}{badge && <em>{badge}</em>}</strong><small>{description}</small></span>
        <input type="checkbox" name={name} checked={Boolean(checked)} disabled={disabled} onChange={onChange} />
        <span className="india-post-settings-switch-ui" aria-hidden="true" />
    </label>;
}

export default function IndiaPostSettingsPage() {
    const [form, setForm] = useState(initialSettings);
    const [readiness, setReadiness] = useState({});
    const [providerStatus, setProviderStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [connectionBusy, setConnectionBusy] = useState(false);
    const [tariffBusy, setTariffBusy] = useState(false);
    const [testDestination, setTestDestination] = useState("");
    const [testWeight, setTestWeight] = useState("500");
    const [testQuote, setTestQuote] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getIndiaPostSettings();
            setForm({ ...initialSettings, ...response.data.settings });
            setReadiness(response.data.readiness || {});
            setProviderStatus(response.data.provider_status || {});
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Could not load India Post settings."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const updateField = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    };

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            const response = await updateIndiaPostSettings(form);
            setForm({ ...initialSettings, ...response.data.settings });
            setReadiness(response.data.readiness || {});
            setProviderStatus((current) => ({
                ...current,
                new_orders: response.data.settings.fulfillment_provider === "india_post"
                    ? "India Post direct"
                    : "Prodinent until direct setup is complete",
            }));
            toast.success(response.data.settings.fulfillment_provider === "india_post"
                ? "India Post settings saved. New orders now route directly to DOP."
                : "India Post setup saved. The current order route has not changed.");
        } catch (requestError) {
            const message = getErrorMessage(requestError, "Could not save India Post settings.");
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const runConnectionTest = async () => {
        setConnectionBusy(true);
        try {
            const response = await testIndiaPostConnection();
            toast.success(response.data.message || "India Post login succeeded.");
        } catch (requestError) {
            toast.error(getErrorMessage(requestError, "India Post login failed."));
        } finally {
            setConnectionBusy(false);
        }
    };

    const runTariffTest = async () => {
        setTariffBusy(true);
        setTestQuote(null);
        try {
            const response = await testIndiaPostTariff({ destination_pincode: testDestination, weight_grams: Number(testWeight) });
            setTestQuote(response.data.quote);
            toast.success(response.data.message || "Live India Post tariff check completed.");
        } catch (requestError) {
            toast.error(getErrorMessage(requestError, "India Post tariff check failed."));
        } finally {
            setTariffBusy(false);
        }
    };

    const directRouteReady = Boolean(
        readiness.tariff_ready
        && readiness.five_km_delivery_ready
        && readiness.booking_ready
        && readiness.product_weights_ready
        && form.direct_tariff_enabled
        && form.fulfillment_enabled
        && form.live_booking_enabled
    );
    const directRouteActive = providerStatus.new_orders === "India Post direct";

    if (loading) return <section className="admin-page"><LoadingState label="Loading India Post settings" /></section>;
    if (error && !Object.keys(form).length) return <section className="admin-page"><ErrorState message={error} onRetry={load} /></section>;

    return <section className="admin-page india-post-settings-page">
        <PageHeader
            eyebrow="SHIPMENTS / DIRECT DEPARTMENT OF POSTS"
            title="India Post settings"
            description="Manage Business Parcel checkout, DOP booking readiness, barcode use, labels, and tracking from this dashboard."
            action={<button type="button" className="admin-button secondary" onClick={load} disabled={loading}><FiRefreshCw aria-hidden="true" /> Refresh</button>}
        />

        <div className={`india-post-settings-status ${directRouteActive ? "is-direct" : "is-pending"}`} role="status">
            <FiShield aria-hidden="true" />
            <div><strong>New order routing: {providerStatus.new_orders || "Loading current route"}</strong>
                <span>India Post becomes the route only after its readiness checks pass and you save. Existing Prodinent order records stay as history; the dashboard blocks new Prodinent actions after switching.</span>
            </div>
        </div>

        {error && <p className="admin-form-error india-post-settings-error" role="alert">{error}</p>}

        <form onSubmit={save}>
            <section className="admin-panel india-post-settings-section">
                <div className="india-post-settings-heading"><div className="india-post-settings-icon"><FiWifi /></div><div><h2>India Post connection</h2><p>Credentials are kept on the backend server and are never sent to this page.</p></div></div>
                <div className="india-post-settings-connection-row">
                    <div><strong>{readiness.api_credentials_configured ? "Credentials configured" : "Credentials missing"}</strong><span>{readiness.api_credentials_configured ? "Customer Self-Service login is available for a secure connection test." : "Set the production Customer Self-Service credentials on the backend before enabling live rates or bookings."}</span></div>
                    <button type="button" className="admin-button secondary" onClick={runConnectionTest} disabled={connectionBusy || !readiness.api_credentials_configured}>{connectionBusy ? "Checking..." : "Test India Post login"}</button>
                </div>
            </section>

            <section className="admin-panel india-post-settings-section">
                <div className="india-post-settings-heading"><div className="india-post-settings-icon"><FiTruck /></div><div><h2>Checkout and local delivery</h2><p>Direct Business Parcel rates apply outside Mittyco’s 5 km local free-delivery area.</p></div></div>
                <SwitchRow name="fulfillment_provider" title="Use India Post for new paid orders" description="Switches only when BP pricing, the 5 km dispatch location, sender, approved barcode office, and product weights are ready. Prodinent then stops receiving new orders." checked={form.fulfillment_provider === "india_post"} onChange={() => setForm((current) => ({ ...current, fulfillment_provider: "india_post" }))} disabled={!directRouteReady || directRouteActive} badge="DIRECT" />
                <SwitchRow name="direct_tariff_enabled" title="Use live India Post BP tariff at checkout" description="Checkout asks the official Business Parcel tariff API for the charge." checked={form.direct_tariff_enabled} onChange={updateField} disabled={!readiness.tariff_ready} />
                <div className="india-post-settings-grid">
                    <Field label="Dispatch PIN code" name="origin_pincode" value={form.origin_pincode} onChange={updateField} inputMode="numeric" maxLength={6} placeholder="6 digits" />
                    <Field label="Dispatch state" name="origin_state" value={form.origin_state} onChange={updateField} placeholder="Kerala" />
                    <Field label="Store latitude" name="origin_latitude" value={form.origin_latitude} onChange={updateField} inputMode="decimal" placeholder="e.g. 12.345678" hint="Used only to measure the local 5 km free-delivery radius." />
                    <Field label="Store longitude" name="origin_longitude" value={form.origin_longitude} onChange={updateField} inputMode="decimal" placeholder="e.g. 75.123456" />
                    <Field label="Parcel length (cm)" name="parcel_length_cm" value={form.parcel_length_cm} onChange={updateField} inputMode="decimal" placeholder="Length" />
                    <Field label="Parcel width (cm)" name="parcel_width_cm" value={form.parcel_width_cm} onChange={updateField} inputMode="decimal" placeholder="Width" />
                    <Field label="Parcel height (cm)" name="parcel_height_cm" value={form.parcel_height_cm} onChange={updateField} inputMode="decimal" placeholder="Height" />
                    <Field label="Fallback item weight (g)" name="default_item_weight_grams" value={form.default_item_weight_grams} onChange={updateField} inputMode="numeric" />
                    <label className="india-post-settings-field"><span>India Post service</span><input value="Business Parcel (BP)" disabled /></label>
                    <label className="india-post-settings-field"><span>Local free-delivery radius</span><input value="5 km" disabled /><small>Fixed at 5 km as requested.</small></label>
                </div>
                <div className="india-post-settings-tariff-test">
                    <div><strong>Check a live BP tariff</strong><small>This calls the DOP price API only. It does not book a shipment.</small></div>
                    <input aria-label="Test destination PIN code" value={testDestination} onChange={(event) => setTestDestination(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Destination PIN" inputMode="numeric" />
                    <input aria-label="Test parcel weight in grams" value={testWeight} onChange={(event) => setTestWeight(event.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="Weight g" inputMode="numeric" />
                    <button type="button" className="admin-button secondary" onClick={runTariffTest} disabled={tariffBusy || !readiness.tariff_ready || testDestination.length !== 6}>{tariffBusy ? "Checking..." : "Test BP tariff"}</button>
                    {testQuote && <p role="status">India Post quote: <strong>₹{testQuote.amount}</strong> · {testQuote.chargeable_weight_grams} g chargeable</p>}
                </div>
            </section>

            <section className="admin-panel india-post-settings-section">
                <div className="india-post-settings-heading"><div className="india-post-settings-icon"><FiTruck /></div><div><h2>Booking and sender details</h2><p>Configure what India Post requires to book an article and generate its label.</p></div></div>
                <Field label="10-digit DOP bulk customer ID" name="bulk_customer_id" value={form.bulk_customer_id} onChange={updateField} inputMode="numeric" maxLength={10} placeholder="From DOP approval" />
                <div className="india-post-settings-grid">
                    <Field label="Sender name" name="sender_name" value={form.sender_name} onChange={updateField} />
                    <Field label="Company / business name" name="sender_company" value={form.sender_company} onChange={updateField} />
                    <Field label="Sender address line 1" name="sender_address_line1" value={form.sender_address_line1} onChange={updateField} />
                    <Field label="Sender address line 2" name="sender_address_line2" value={form.sender_address_line2} onChange={updateField} />
                    <Field label="Sender address line 3" name="sender_address_line3" value={form.sender_address_line3} onChange={updateField} />
                    <Field label="Sender city" name="sender_city" value={form.sender_city} onChange={updateField} />
                    <Field label="Sender state" name="sender_state" value={form.sender_state} onChange={updateField} />
                    <Field label="Sender PIN code" name="sender_pincode" value={form.sender_pincode} onChange={updateField} inputMode="numeric" maxLength={6} />
                    <Field label="Sender mobile" name="sender_mobile" value={form.sender_mobile} onChange={updateField} inputMode="tel" maxLength={15} />
                    <label className="india-post-settings-field"><span>Parcel shape</span><select name="shape_of_article" value={form.shape_of_article} onChange={updateField}><option value="NROL">Non-rollable (NROL)</option><option value="ROLL">Rollable (ROLL)</option></select></label>
                    <label className="india-post-settings-field"><span>Transmission mode</span><select name="label_transmission_mode" value={form.label_transmission_mode} onChange={updateField}><option value="S">Surface</option><option value="A">Air</option></select></label>
                </div>
                <div className="india-post-settings-readiness" aria-label="India Post setup readiness">
                    <h3>Setup checklist</h3>
                    {readinessLabels.map(([key, label]) => <div key={key} className={readiness[key] ? "is-ready" : "is-missing"}>{readiness[key] ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}<span>{label}{key === "product_weights_ready" && !readiness[key] ? ` (${readiness.products_missing_shipping_weights ?? 0} missing)` : ""}</span><strong>{readiness[key] ? "Ready" : "Needed"}</strong></div>)}
                    <p>Enter each actual packed weight in the product editor. Barcode ranges and drop-off offices are managed in <b>India Post Barcodes</b>; choose the office approved for your contract.</p>
                </div>
                <SwitchRow name="fulfillment_enabled" title="Allow manual India Post booking from an order" description="An admin must open a paid order and press Book shipment. Booking consumes one allocated barcode." checked={form.fulfillment_enabled} onChange={updateField} />
                <SwitchRow name="live_booking_enabled" title="Allow live DOP bookings" description="Enables the real India Post booking endpoint. First validate the barcode range, sender and approved booking office." checked={form.live_booking_enabled} onChange={updateField} disabled={!readiness.booking_ready || !form.fulfillment_enabled} />
                <SwitchRow name="auto_booking_enabled" title="Automatically book new eligible orders" description="Books after successful payment and direct tariff quote. Leave off until manual pilot shipments are verified." checked={form.auto_booking_enabled} onChange={updateField} disabled={!readiness.auto_booking_ready || !form.live_booking_enabled || !form.direct_tariff_enabled} badge="PILOT FIRST" />
            </section>

            <div className="india-post-settings-savebar"><span>API passwords and access tokens stay on the backend server.</span><button type="submit" className="admin-button primary" disabled={saving}>{saving ? "Saving..." : <><FiSave aria-hidden="true" /> Save India Post settings</>}</button></div>
        </form>
    </section>;
}
