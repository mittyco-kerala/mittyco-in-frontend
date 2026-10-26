import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { createResource, getErrorMessage, getResource, listResource, updateResource } from "../services/adminApi";
import { LoadingState } from "../components/AdminPrimitives";
import { validateWelcomeBonus, welcomeBonusPayload } from "./welcomeBonusForm";
import "../styles/HeroBannerEditor.css";
import "../styles/WelcomeBonus.css";

const emptyWelcomeBonus = {
    name: "",
    applicability_type: "PRODUCT",
    product: "",
    category: "",
    discount_type: "PERCENTAGE",
    discount_percentage: "",
    fixed_amount: "",
    start_date: "",
    end_date: "",
    is_active: true,
};

const idOf = (value) => value?.id ?? value?.pk ?? value?.uuid ?? value;
const labelOf = (value, fallback) => value?.name || value?.title || value?.label || fallback;
const rowsFromPayload = (payload) => Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
const toLocalDateTime = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 16);
    const pad = (part) => String(part).padStart(2, "0");
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

function normalizeWelcomeBonus(row = {}) {
    const rawApplyTo = String(row.applicability_type || row.apply_to || row.target_type || (row.category ? "CATEGORY" : "PRODUCT")).toUpperCase();
    const rawDiscountType = String(row.discount_type || (row.fixed_amount != null ? "FIXED" : "PERCENTAGE")).toUpperCase();
    return {
        name: row.name || "",
        applicability_type: rawApplyTo.includes("CATEGORY") ? "CATEGORY" : "PRODUCT",
        product: String(idOf(row.product ?? row.product_id ?? row.products?.[0]) ?? ""),
        category: String(idOf(row.category ?? row.category_id) ?? ""),
        discount_type: rawDiscountType.includes("FIXED") ? "FIXED" : "PERCENTAGE",
        discount_percentage: row.discount_percentage ?? (rawDiscountType.includes("FIXED") ? "" : row.discount_value ?? ""),
        fixed_amount: row.fixed_amount ?? (rawDiscountType.includes("FIXED") ? row.discount_value ?? "" : ""),
        start_date: toLocalDateTime(row.start_date || row.valid_from),
        end_date: toLocalDateTime(row.end_date || row.valid_until),
        is_active: row.is_active !== false,
    };
}

export default function WelcomeBonusEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const editing = Boolean(id);
    const [values, setValues] = useState(emptyWelcomeBonus);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [requestError, setRequestError] = useState("");

    useEffect(() => {
        let active = true;
        Promise.all([listResource("products", { page_size: 500 }), listResource("categories", { page_size: 500 })])
            .then(([productResponse, categoryResponse]) => {
                if (!active) return;
                setProducts(rowsFromPayload(productResponse.data));
                setCategories(rowsFromPayload(categoryResponse.data));
            })
            .catch(() => { if (active) { setProducts([]); setCategories([]); } });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!editing) return undefined;
        let active = true;
        getResource("welcome-bonuses", id)
            .then((response) => { if (active) setValues(normalizeWelcomeBonus(response.data)); })
            .catch((error) => { if (active) setRequestError(getErrorMessage(error, "Could not load Welcome Bonus.")); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [editing, id]);

    const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));
    const setApplyTo = (applicability_type) => setValues((current) => ({ ...current, applicability_type, product: applicability_type === "PRODUCT" ? current.product : "", category: applicability_type === "CATEGORY" ? current.category : "" }));
    const setDiscountType = (discount_type) => setValues((current) => ({ ...current, discount_type, discount_percentage: discount_type === "PERCENTAGE" ? current.discount_percentage : "", fixed_amount: discount_type === "FIXED" ? current.fixed_amount : "" }));

    const save = async (event) => {
        event.preventDefault();
        if (saving) return;
        const nextErrors = validateWelcomeBonus(values);
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            setRequestError("Please correct the highlighted fields.");
            return;
        }
        setSaving(true);
        setErrors({});
        setRequestError("");
        try {
            const payload = welcomeBonusPayload(values);
            if (editing) await updateResource("welcome-bonuses", id, payload);
            else await createResource("welcome-bonuses", payload);
            toast.success(editing ? "Welcome Bonus updated" : "Welcome Bonus created");
            navigate("/mittyco-dashboard/welcome-bonuses");
        } catch (error) {
            const serverErrors = error?.response?.data;
            if (serverErrors && typeof serverErrors === "object") setErrors(Object.fromEntries(Object.entries(serverErrors).map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : String(value)])));
            setRequestError(getErrorMessage(error, "Could not save Welcome Bonus."));
            toast.error(getErrorMessage(error, "Could not save Welcome Bonus."));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="admin-page"><LoadingState label="Loading Welcome Bonus..." /></div>;
    const targetError = values.applicability_type === "PRODUCT" ? errors.product : errors.category;
    const discountError = values.discount_type === "PERCENTAGE" ? errors.discount_percentage : errors.fixed_amount;
    return <div className="hero-banner-editor-page welcome-bonus-editor-page">
        <div className="hero-editor-heading"><div><button type="button" className="hero-back-link" onClick={() => navigate("/mittyco-dashboard/welcome-bonuses")}><FiArrowLeft /> Welcome Bonuses</button><h2>{editing ? "Edit Welcome Bonus" : "Add Welcome Bonus"}</h2></div><div className="hero-breadcrumb">Dashboard&nbsp; / &nbsp;Welcome Bonuses&nbsp; / &nbsp;{editing ? "Edit" : "Add"}</div></div>
        <div className="hero-editor-layout"><section className="hero-editor-card"><form className="hero-editor-form" onSubmit={save} noValidate>
            <label className={`hero-editor-field ${errors.name ? "has-error" : ""}`}><span>Name <em>*</em></span><input autoFocus type="text" value={values.name} onChange={(event) => setValue("name", event.target.value)} placeholder="e.g. New customer welcome offer" />{errors.name && <small>{errors.name}</small>}</label>
            <fieldset className="coupon-choice-field"><legend>Apply To <em>*</em></legend><label><input type="radio" name="welcome_apply_to" checked={values.applicability_type === "PRODUCT"} onChange={() => setApplyTo("PRODUCT")} /> Product Wise</label><label><input type="radio" name="welcome_apply_to" checked={values.applicability_type === "CATEGORY"} onChange={() => setApplyTo("CATEGORY")} /> Category Wise</label></fieldset>
            <label className={`hero-editor-field ${targetError ? "has-error" : ""}`}><span>{values.applicability_type === "PRODUCT" ? "Product" : "Category"} <em>*</em></span><select value={values.applicability_type === "PRODUCT" ? values.product : values.category} onChange={(event) => setValue(values.applicability_type === "PRODUCT" ? "product" : "category", event.target.value)}><option value="">Select {values.applicability_type === "PRODUCT" ? "product" : "category"}</option>{(values.applicability_type === "PRODUCT" ? products : categories).map((target) => <option key={idOf(target)} value={idOf(target)}>{labelOf(target, `${values.applicability_type === "PRODUCT" ? "Product" : "Category"} ${idOf(target)}`)}</option>)}</select>{targetError && <small>{targetError}</small>}</label>
            <fieldset className="coupon-choice-field"><legend>Discount Type <em>*</em></legend><label><input type="radio" name="welcome_discount_type" checked={values.discount_type === "PERCENTAGE"} onChange={() => setDiscountType("PERCENTAGE")} /> Percentage</label><label><input type="radio" name="welcome_discount_type" checked={values.discount_type === "FIXED"} onChange={() => setDiscountType("FIXED")} /> Fixed Amount</label></fieldset>
            <label className={`hero-editor-field ${discountError ? "has-error" : ""}`}><span>{values.discount_type === "PERCENTAGE" ? "Percentage" : "Fixed Amount"} <em>*</em></span><input type="number" min="0.01" max={values.discount_type === "PERCENTAGE" ? "100" : undefined} step="0.01" value={values.discount_type === "PERCENTAGE" ? values.discount_percentage : values.fixed_amount} onChange={(event) => setValue(values.discount_type === "PERCENTAGE" ? "discount_percentage" : "fixed_amount", event.target.value)} placeholder={values.discount_type === "PERCENTAGE" ? "10" : "100.00"} />{discountError && <small>{discountError}</small>}</label>
            <label className={`hero-editor-field ${errors.start_date ? "has-error" : ""}`}><span>Start Date <em>*</em></span><input type="datetime-local" value={values.start_date} onChange={(event) => setValue("start_date", event.target.value)} />{errors.start_date && <small>{errors.start_date}</small>}</label>
            <label className={`hero-editor-field ${errors.end_date ? "has-error" : ""}`}><span>End Date <em>*</em></span><input type="datetime-local" value={values.end_date} onChange={(event) => setValue("end_date", event.target.value)} />{errors.end_date && <small>{errors.end_date}</small>}</label>
            <label className="hero-editor-field welcome-bonus-active"><span>Active</span><input type="checkbox" checked={Boolean(values.is_active)} onChange={(event) => setValue("is_active", event.target.checked)} /><small className="hero-field-help">Inactive bonuses are not assigned to new eligible users.</small></label>
            {requestError && <p className="hero-editor-error" role="alert">{requestError}</p>}
            <div className="coupon-form-actions"><button type="button" className="hero-secondary-button" onClick={() => navigate("/mittyco-dashboard/welcome-bonuses")} disabled={saving}>Cancel</button><button type="submit" className="hero-save-button" disabled={saving}><FiSave /> {saving ? "Saving..." : "Save Welcome Bonus"}</button></div>
        </form></section></div>
    </div>;
}
