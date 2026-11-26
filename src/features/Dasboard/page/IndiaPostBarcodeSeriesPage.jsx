import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FiArchive, FiCheckCircle, FiEdit2, FiPlus, FiRefreshCw, FiShield, FiTag } from "react-icons/fi";
import { EmptyState, ErrorState, LoadingState, Modal, PageHeader } from "../components/AdminPrimitives";
import {
    createIndiaPostBarcodeSeries,
    getErrorMessage,
    listIndiaPostBarcodeSeries,
    searchIndiaPostOffices,
    unwrapList,
    updateIndiaPostBarcodeSeries,
} from "../services/adminApi";
import "../styles/IndiaPostBarcodeSeries.css";

const initialForm = {
    name: "",
    contract_id: "",
    barcode_prefix: "",
    first_number: "",
    last_number: "",
    booking_office_id: "",
    booking_office_name: "",
    dropoff_pincode: "",
};

const serial = (value) => String(value ?? "").padStart(8, "0");
const s10Barcode = (prefix, value) => {
    if (value == null) return "—";
    const serialValue = serial(value);
    const weights = [8, 6, 4, 2, 3, 5, 9, 7];
    const remainder = [...serialValue].reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0) % 11;
    const check = 11 - remainder;
    const checkDigit = check === 10 ? "0" : check === 11 ? "5" : String(check);
    return `${prefix}${serialValue}${checkDigit}IN`;
};

function TextField({ label, name, value, onChange, hint, ...inputProps }) {
    return <label className="india-post-series-field">
        <span>{label}</span>
        <input name={name} value={value} onChange={onChange} {...inputProps} />
        {hint && <small>{hint}</small>}
    </label>;
}

export default function IndiaPostBarcodeSeriesPage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [officeEditor, setOfficeEditor] = useState(null);
    const [officeForm, setOfficeForm] = useState({ booking_office_id: "", booking_office_name: "", dropoff_pincode: "" });
    const [savingOffice, setSavingOffice] = useState(false);
    const [officeSearchBusy, setOfficeSearchBusy] = useState(false);
    const [offices, setOffices] = useState([]);

    const loadSeries = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await listIndiaPostBarcodeSeries({ page_size: 100 });
            setRows(unwrapList(response.data).rows);
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Could not load India Post barcode series."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void loadSeries(); }, [loadSeries]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: name === "barcode_prefix" ? value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) : value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await createIndiaPostBarcodeSeries({
                ...form,
                article_type: "BP",
                first_number: Number(form.first_number),
                last_number: Number(form.last_number),
            });
            toast.success("India Post BP barcode series saved.");
            setForm(initialForm);
            await loadSeries();
        } catch (requestError) {
            toast.error(getErrorMessage(requestError, "Could not save the barcode series."));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (series) => {
        setBusyId(series.id);
        try {
            await updateIndiaPostBarcodeSeries(series.id, { is_active: !series.is_active });
            toast.success(series.is_active ? "Series paused. Existing barcode history is retained." : "Series activated.");
            await loadSeries();
        } catch (requestError) {
            toast.error(getErrorMessage(requestError, "Could not update the series."));
        } finally {
            setBusyId(null);
        }
    };

    const openOfficeEditor = (series) => {
        setOffices([]);
        setOfficeEditor(series);
        setOfficeForm({
            booking_office_id: series.booking_office_id || "",
            booking_office_name: series.booking_office_name || "",
            dropoff_pincode: series.dropoff_pincode || "",
        });
    };

    const saveOfficeDetails = async (event) => {
        event.preventDefault();
        if (!officeEditor) return;
        setSavingOffice(true);
        try {
            await updateIndiaPostBarcodeSeries(officeEditor.id, officeForm);
            toast.success("Booking office details saved. Barcode allocation is unchanged.");
            setOfficeEditor(null);
            await loadSeries();
        } catch (requestError) {
            toast.error(getErrorMessage(requestError, "Could not save booking office details."));
        } finally {
            setSavingOffice(false);
        }
    };

    const searchOffices = async (pincode) => {
        if (!/^\d{6}$/.test(String(pincode || ""))) {
            toast.error("Enter a 6-digit drop-off PIN code first.");
            return;
        }
        setOfficeSearchBusy(true);
        setOffices([]);
        try {
            const response = await searchIndiaPostOffices(pincode);
            const found = response.data?.offices || [];
            setOffices(found);
            if (!found.length) toast.error("India Post found no eligible booking offices for that PIN.");
        } catch (requestError) {
            toast.error(getErrorMessage(requestError, "Could not search India Post offices."));
        } finally {
            setOfficeSearchBusy(false);
        }
    };

    const selectOffice = (office, target) => {
        const values = {
            booking_office_id: office.office_id,
            booking_office_name: office.office_name,
            dropoff_pincode: office.pincode,
        };
        if (target === "series") setForm((current) => ({ ...current, ...values }));
        else setOfficeForm((current) => ({ ...current, ...values }));
        setOffices([]);
    };

    const firstSerial = /^\d{1,8}$/.test(form.first_number) ? Number(form.first_number) : null;
    const lastSerial = /^\d{1,8}$/.test(form.last_number) ? Number(form.last_number) : null;
    const proposedBarcodeCount = firstSerial !== null && lastSerial !== null && lastSerial >= firstSerial
        ? lastSerial - firstSerial + 1
        : 0;

    return <section className="admin-page india-post-series-page">
        <PageHeader
            eyebrow="SHIPMENTS / INDIA POST"
            title="India Post barcode series"
            description="Save and manage barcode blocks officially allocated for your Business Parcel contract."
            action={<button type="button" className="admin-button secondary" onClick={loadSeries} disabled={loading}>
                <FiRefreshCw aria-hidden="true" /> Refresh
            </button>}
        />

        <div className="india-post-series-notice" role="note">
            <FiShield aria-hidden="true" />
            <div><strong>Use only a range allocated by India Post.</strong><span>Do not enter a self-created barcode range. Saved ranges are retained for audit and cannot be deleted or renumbered.</span></div>
        </div>

        <form className="admin-panel india-post-series-form" onSubmit={handleSubmit}>
            <div className="india-post-series-section-title"><span className="india-post-series-icon"><FiPlus aria-hidden="true" /></span><div><h3>Add allocated BP series</h3><p>Enter the allocation details shown in the India Post portal or approval.</p></div></div>
            <div className="india-post-series-grid">
                <TextField label="Series name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. BP block Nov 2026" maxLength={80} required />
                <TextField label="BP contract ID" name="contract_id" value={form.contract_id} onChange={handleChange} placeholder="8 digits" inputMode="numeric" pattern="[0-9]{8}" maxLength={8} required />
                <TextField label="Barcode prefix" name="barcode_prefix" value={form.barcode_prefix} onChange={handleChange} placeholder="e.g. CX" pattern="[A-Z]{2}" maxLength={2} required hint="The two letters printed on the DOP allocated series." />
                <TextField label="First serial number" name="first_number" value={form.first_number} onChange={handleChange} placeholder="8 digits" inputMode="numeric" pattern="[0-9]{1,8}" maxLength={8} required hint="First allocated 8-digit serial only; omit the prefix, check digit, and IN." />
                <TextField label="Last serial number" name="last_number" value={form.last_number} onChange={handleChange} placeholder="8 digits" inputMode="numeric" pattern="[0-9]{1,8}" maxLength={8} required hint="Inclusive last 8-digit serial in the approved block." />
            </div>
            <details className="india-post-series-optional-office">
                <summary>Booking office details <span>Optional now; required before booking shipments</span></summary>
                <div className="india-post-series-grid">
                    <TextField label="DOP booking office ID" name="booking_office_id" value={form.booking_office_id} onChange={handleChange} placeholder="8 digits" inputMode="numeric" pattern="[0-9]{8}" maxLength={8} />
                    <TextField label="Booking office name" name="booking_office_name" value={form.booking_office_name} onChange={handleChange} placeholder="As shown by India Post" maxLength={100} />
                    <div className="india-post-office-lookup"><TextField label="Drop-off PIN code" name="dropoff_pincode" value={form.dropoff_pincode} onChange={handleChange} placeholder="6 digits" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} /><button type="button" className="admin-button secondary" onClick={() => searchOffices(form.dropoff_pincode)} disabled={officeSearchBusy}>{officeSearchBusy ? "Searching..." : "Find offices"}</button></div>
                    {offices.length > 0 && <label className="india-post-series-field india-post-office-results"><span>Choose the DOP-approved booking office</span><select defaultValue="" onChange={(event) => { const office = offices.find((item) => item.office_id === event.target.value); if (office) selectOffice(office, "series"); }}><option value="">Select an office</option>{offices.map((office) => <option key={office.office_id} value={office.office_id}>{office.office_name} · {office.office_type_code} · ID {office.office_id}</option>)}</select><small>Search results are from India Post. Select only the office approved for your contract/drop-off.</small></label>}
                </div>
            </details>
            <div className="india-post-series-form-footer"><div><span>Service: <strong>Business Parcel (BP)</strong></span>{proposedBarcodeCount > 0 && <small className={proposedBarcodeCount === 1 ? "is-single-range" : ""}>{proposedBarcodeCount.toLocaleString("en-IN")} barcode{proposedBarcodeCount === 1 ? "" : "s"} · {s10Barcode(form.barcode_prefix, firstSerial)} to {s10Barcode(form.barcode_prefix, lastSerial)}. Check this against the DOP allocation before saving.</small>}</div><button type="submit" className="admin-button primary" disabled={saving}>{saving ? "Saving..." : <><FiPlus aria-hidden="true" /> Save series</>}</button></div>
        </form>

        <section className="admin-panel india-post-series-list" aria-labelledby="india-post-series-heading">
            <div className="india-post-series-list-heading"><div><p className="admin-eyebrow">ALLOCATED RANGES</p><h3 id="india-post-series-heading">Saved barcode series</h3></div><span className="india-post-series-count"><FiTag aria-hidden="true" /> {rows.length}</span></div>
            {loading ? <LoadingState label="Loading barcode series" /> : error ? <ErrorState message={error} onRetry={loadSeries} /> : rows.length === 0 ? <EmptyState title="No barcode series saved" description="Once India Post allocates a BP barcode block, add its exact range here." /> : <div className="india-post-series-table-wrap"><table className="india-post-series-table">
                <thead><tr><th>Series / contract</th><th>Allocated range</th><th>Next unused</th><th>Remaining</th><th>Booking office</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>{rows.map((series) => {
                    const exhausted = Number(series.remaining_count) <= 0;
                    return <tr key={series.id}>
                        <td><strong>{series.name}</strong><small>BP · Contract {series.contract_id}</small></td>
                        <td><code>{s10Barcode(series.barcode_prefix, series.allocation_start)} – {s10Barcode(series.barcode_prefix, series.last_number)}</code></td>
                        <td>{exhausted ? "Exhausted" : <code>{s10Barcode(series.barcode_prefix, series.next_number)}</code>}</td>
                        <td>{Number(series.remaining_count).toLocaleString("en-IN")}</td>
                        <td>{series.booking_office_name ? <><strong>{series.booking_office_name}</strong><small>ID {series.booking_office_id} · PIN {series.dropoff_pincode}</small></> : <><strong>Not set</strong><small>Add before shipment booking</small></>}</td>
                        <td><span className={`india-post-series-status ${series.is_active && !exhausted ? "active" : "paused"}`}>{exhausted ? "Exhausted" : series.is_active ? "Active" : "Paused"}</span></td>
                        <td><div className="india-post-series-actions">
                            <button type="button" className="admin-button secondary" onClick={() => openOfficeEditor(series)}><FiEdit2 aria-hidden="true" /> Office</button>
                            <button type="button" className={`admin-button ${series.is_active ? "secondary" : "primary"}`} onClick={() => void toggleActive(series)} disabled={busyId === series.id || exhausted}>
                                {series.is_active ? <><FiArchive aria-hidden="true" /> Pause</> : <><FiCheckCircle aria-hidden="true" /> Activate</>}
                            </button>
                        </div></td>
                    </tr>;
                })}</tbody>
            </table></div>}
        </section>
        {officeEditor && <Modal title="Booking office details" onClose={() => !savingOffice && setOfficeEditor(null)}>
            <form className="india-post-office-modal" onSubmit={saveOfficeDetails}>
                <p>These details are not needed to save a barcode range. Enter the DOP-approved office details before booking a shipment.</p>
                <label className="india-post-series-field"><span>DOP booking office ID</span><input value={officeForm.booking_office_id} onChange={(event) => setOfficeForm((current) => ({ ...current, booking_office_id: event.target.value }))} inputMode="numeric" pattern="[0-9]{8}" maxLength={8} required /></label>
                <label className="india-post-series-field"><span>Booking office name</span><input value={officeForm.booking_office_name} onChange={(event) => setOfficeForm((current) => ({ ...current, booking_office_name: event.target.value }))} maxLength={100} required /></label>
                <div className="india-post-office-lookup"><label className="india-post-series-field"><span>Drop-off PIN code</span><input value={officeForm.dropoff_pincode} onChange={(event) => setOfficeForm((current) => ({ ...current, dropoff_pincode: event.target.value.replace(/\D/g, "").slice(0, 6) }))} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label><button type="button" className="admin-button secondary" onClick={() => searchOffices(officeForm.dropoff_pincode)} disabled={officeSearchBusy}>{officeSearchBusy ? "Searching..." : "Find offices"}</button></div>
                {offices.length > 0 && <label className="india-post-series-field india-post-office-results"><span>Choose the DOP-approved booking office</span><select defaultValue="" onChange={(event) => { const office = offices.find((item) => item.office_id === event.target.value); if (office) selectOffice(office, "edit"); }}><option value="">Select an office</option>{offices.map((office) => <option key={office.office_id} value={office.office_id}>{office.office_name} · {office.office_type_code} · ID {office.office_id}</option>)}</select><small>Search results are from India Post. Select only the office approved for your contract/drop-off.</small></label>}
                <div className="admin-modal-actions"><button type="button" className="admin-button secondary" onClick={() => setOfficeEditor(null)} disabled={savingOffice}>Cancel</button><button type="submit" className="admin-button primary" disabled={savingOffice}>{savingOffice ? "Saving..." : "Save office details"}</button></div>
            </form>
        </Modal>}
    </section>;
}
