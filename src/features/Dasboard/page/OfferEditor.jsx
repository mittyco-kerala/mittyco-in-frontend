import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FiArrowLeft, FiChevronDown, FiSave, FiSearch } from "react-icons/fi";
import { createResource, flattenApiErrors, getErrorMessage, getResource, listResource, updateResource } from "../services/adminApi";
import { LoadingState, PageHeader } from "../components/AdminPrimitives";
import "../styles/HeroBannerEditor.css";

const emptyOffer = {
    title: "",
    description: "",
    image: null,
    product: "",
    variant: "",
    discount_type: "PERCENTAGE",
    discount_percentage: "",
    fixed_amount: "",
    start_date: "",
    end_date: "",
    is_active: true,
};

const idOf = (row) => row?.id ?? row?.pk ?? row?.uuid;
const rows = (payload) => Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
const labelOf = (row) => row?.name || row?.title || `#${idOf(row)}`;
const pad = (value) => String(value).padStart(2, "0");

function dateValue(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
}

function variantLabel(variant) {
    const color = variant?.color?.name || variant?.color_name;
    const price = variant?.price_type === "single" && variant?.price != null ? ` · ₹${variant.price}` : " · Multiple price";
    return `${color || `Variant #${idOf(variant)}`}${variant?.sku ? ` · ${variant.sku}` : ""}${price}`;
}

function normalizeOffer(row) {
    const discountType = String(row?.discount_type || (row?.fixed_amount != null ? "FIXED" : "PERCENTAGE")).toUpperCase();
    return {
        ...emptyOffer,
        ...row,
        image: row?.image || null,
        product: idOf(row?.product) || row?.product || "",
        variant: idOf(row?.variant) || row?.variant || "",
        discount_type: discountType === "FIXED" ? "FIXED" : "PERCENTAGE",
        discount_percentage: row?.discount_percentage ?? (discountType === "FIXED" ? "" : row?.discount_value ?? ""),
        fixed_amount: row?.fixed_amount ?? (discountType === "FIXED" ? row?.discount_value ?? "" : ""),
        start_date: dateValue(row?.start_date),
        end_date: dateValue(row?.end_date),
        is_active: row?.is_active !== false,
    };
}

function errorMap(error) {
    return flattenApiErrors(error?.response?.data || {});
}

export default function OfferEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const editing = Boolean(id);
    const [values, setValues] = useState(emptyOffer);
    const [products, setProducts] = useState([]);
    const [variants, setVariants] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [productMenuOpen, setProductMenuOpen] = useState(false);
    const [loading, setLoading] = useState(editing);
    const [productsLoading, setProductsLoading] = useState(true);
    const [variantsLoading, setVariantsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [requestError, setRequestError] = useState("");

    useEffect(() => {
        let active = true;
        listResource("products", { page_size: 500 })
            .then((response) => { if (active) setProducts(rows(response.data)); })
            .catch((error) => { if (active) setRequestError(getErrorMessage(error, "Could not load products.")); })
            .finally(() => { if (active) setProductsLoading(false); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!editing) return undefined;
        let active = true;
        getResource("offers", id)
            .then((response) => { if (active) setValues(normalizeOffer(response.data)); })
            .catch((error) => { if (active) setRequestError(getErrorMessage(error, "Could not load offer.")); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [editing, id]);

    useEffect(() => {
        if (!values.product) {
            setVariants([]);
            return undefined;
        }
        let active = true;
        setVariantsLoading(true);
        listResource("product-variants", { product: values.product, page_size: 500 })
            .then((response) => { if (active) setVariants(rows(response.data)); })
            .catch(() => { if (active) setVariants([]); })
            .finally(() => { if (active) setVariantsLoading(false); });
        return () => { active = false; };
    }, [values.product]);

    const selectedProduct = products.find((product) => String(idOf(product)) === String(values.product));
    const filteredProducts = useMemo(() => {
        const query = productSearch.trim().toLowerCase();
        if (!query) return products;
        return products.filter((product) => `${labelOf(product)} ${product?.category?.name || ""}`.toLowerCase().includes(query));
    }, [products, productSearch]);

    const setValue = (name, value) => setValues((current) => ({ ...current, [name]: value }));
    const selectProduct = (product) => {
        setValues((current) => ({ ...current, product: idOf(product) || "", variant: "" }));
        setProductSearch(labelOf(product));
        setProductMenuOpen(false);
    };
    const selectDiscountType = (discount_type) => setValues((current) => ({
        ...current,
        discount_type,
        discount_percentage: discount_type === "PERCENTAGE" ? current.discount_percentage : "",
        fixed_amount: discount_type === "FIXED" ? current.fixed_amount : "",
    }));

    const validate = () => {
        const next = {};
        if (!String(values.title || "").trim()) next.title = "Offer title is required.";
        if (!String(values.description || "").trim()) next.description = "Offer description is required.";
        if (!values.product) next.product = "Select a product.";
        if (!editing && !(values.image instanceof File)) next.image = "Offer image is required.";
        if (values.discount_type === "PERCENTAGE") {
            if (!Number.isFinite(Number(values.discount_percentage)) || Number(values.discount_percentage) <= 0 || Number(values.discount_percentage) > 100) next.discount_percentage = "Enter a percentage between 0 and 100.";
        } else if (!Number.isFinite(Number(values.fixed_amount)) || Number(values.fixed_amount) <= 0) next.fixed_amount = "Enter a fixed amount greater than 0.";
        if (!values.start_date) next.start_date = "Start date is required.";
        if (!values.end_date) next.end_date = "End date is required.";
        if (values.start_date && values.end_date && values.start_date >= values.end_date) next.end_date = "End date must be after start date.";
        return next;
    };

    const save = async (event) => {
        event.preventDefault();
        const validation = validate();
        if (Object.keys(validation).length) { setErrors(validation); return; }
        setSaving(true); setErrors({}); setRequestError("");
        try {
            const form = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                if (["image", "variant", "discount_percentage", "fixed_amount"].includes(key)) return;
                if (value !== null && value !== undefined && value !== "") form.append(key, value);
            });
            form.append("product", String(values.product));
            if (values.variant) form.append("variant", String(values.variant));
            if (values.discount_type === "PERCENTAGE") form.append("discount_percentage", String(values.discount_percentage));
            else form.append("fixed_amount", String(values.fixed_amount));
            if (values.image instanceof File) form.append("image", values.image);
            if (editing) await updateResource("offers", id, form);
            else await createResource("offers", form);
            toast.success(editing ? "Offer updated" : "Offer created");
            navigate("/mittyco-dashboard/offers");
        } catch (error) {
            setErrors(errorMap(error));
            setRequestError(getErrorMessage(error, "Could not save offer."));
            toast.error(getErrorMessage(error, "Could not save offer."));
        } finally { setSaving(false); }
    };

    if (loading) return <div className="admin-page"><LoadingState label="Loading offer editor..." /></div>;

    return <div className="admin-page resource-editor-page">
        <button type="button" className="admin-back-link" onClick={() => navigate("/mittyco-dashboard/offers")}><FiArrowLeft /> Back to Offers</button>
        <PageHeader eyebrow={editing ? "EDIT OFFER" : "NEW OFFER"} title={`${editing ? "Edit" : "Add"} Offer`} description="Attach an offer to one product and optionally one variant." />
        <section className="admin-panel resource-editor-panel">
            <form className="admin-form offer-editor-form" onSubmit={save}>
                <div className="admin-form-grid">
                    <label className={`admin-form-field ${errors.title ? "has-error" : ""}`}><span>Offer title *</span><input value={values.title || ""} onChange={(event) => setValue("title", event.target.value)} placeholder="e.g. Weekend Coconut Oil Offer" />{errors.title && <small className="field-error">{errors.title}</small>}</label>
                    <label className={`admin-form-field ${errors.description ? "has-error" : ""}`}><span>Description *</span><textarea rows="4" value={values.description || ""} onChange={(event) => setValue("description", event.target.value)} placeholder="Describe this offer" />{errors.description && <small className="field-error">{errors.description}</small>}</label>
                </div>

                <div className="admin-form-grid">
                    <div className={`admin-form-field offer-product-picker ${errors.product ? "has-error" : ""}`}>
                        <span>Product *</span>
                        <div className="offer-product-search"><FiSearch /><input value={productMenuOpen ? productSearch : (selectedProduct ? labelOf(selectedProduct) : productSearch)} onFocus={() => setProductMenuOpen(true)} onChange={(event) => { setProductSearch(event.target.value); setProductMenuOpen(true); }} placeholder="Search and select a product" /><FiChevronDown /></div>
                        {productMenuOpen && <div className="offer-product-options">{productsLoading ? <small>Loading products...</small> : filteredProducts.length ? filteredProducts.slice(0, 50).map((product) => <button type="button" key={idOf(product)} className={String(idOf(product)) === String(values.product) ? "selected" : ""} onClick={() => selectProduct(product)}>{labelOf(product)}<small>{product?.category?.name || "Catalog product"}</small></button>) : <small>No matching products.</small>}</div>}
                        {errors.product && <small className="field-error">{errors.product}</small>}
                    </div>
                    <label className="admin-form-field"><span>Variant (optional)</span><select value={values.variant || ""} onChange={(event) => setValue("variant", event.target.value)} disabled={!values.product || variantsLoading}><option value="">All variants of this product</option>{variants.map((variant) => <option key={idOf(variant)} value={idOf(variant)}>{variantLabel(variant)}</option>)}</select>{values.product && !variantsLoading && !variants.length && <small className="field-hint">This product has no variants yet.</small>}</label>
                </div>

                <div className="admin-form-grid">
                    <fieldset className="coupon-choice-field"><legend>Discount type *</legend><label><input type="radio" checked={values.discount_type === "PERCENTAGE"} onChange={() => selectDiscountType("PERCENTAGE")} /> Percentage</label><label><input type="radio" checked={values.discount_type === "FIXED"} onChange={() => selectDiscountType("FIXED")} /> Fixed amount</label></fieldset>
                    {values.discount_type === "PERCENTAGE" ? <label className={`admin-form-field ${errors.discount_percentage ? "has-error" : ""}`}><span>Discount percentage *</span><input type="number" min="0.01" max="100" step="0.01" value={values.discount_percentage || ""} onChange={(event) => setValue("discount_percentage", event.target.value)} placeholder="10" />{errors.discount_percentage && <small className="field-error">{errors.discount_percentage}</small>}</label> : <label className={`admin-form-field ${errors.fixed_amount ? "has-error" : ""}`}><span>Fixed amount *</span><input type="number" min="0.01" step="0.01" value={values.fixed_amount || ""} onChange={(event) => setValue("fixed_amount", event.target.value)} placeholder="50.00" />{errors.fixed_amount && <small className="field-error">{errors.fixed_amount}</small>}</label>}
                </div>

                <div className="admin-form-grid">
                    <label className={`admin-form-field ${errors.start_date ? "has-error" : ""}`}><span>Start date *</span><input type="date" value={values.start_date || ""} onChange={(event) => setValue("start_date", event.target.value)} />{errors.start_date && <small className="field-error">{errors.start_date}</small>}</label>
                    <label className={`admin-form-field ${errors.end_date ? "has-error" : ""}`}><span>End date *</span><input type="date" value={values.end_date || ""} onChange={(event) => setValue("end_date", event.target.value)} />{errors.end_date && <small className="field-error">{errors.end_date}</small>}</label>
                </div>

                <div className="admin-form-grid">
                    <label className={`admin-form-field ${errors.image ? "has-error" : ""}`}><span>Offer image {!editing && "*"}</span><input type="file" accept="image/*" onChange={(event) => setValue("image", event.target.files?.[0] || null)} />{values.image && !(values.image instanceof File) && <img className="admin-image-preview" src={values.image} alt="Current offer" />}{errors.image && <small className="field-error">{errors.image}</small>}</label>
                    <label className="product-toggle"><input type="checkbox" checked={Boolean(values.is_active)} onChange={(event) => setValue("is_active", event.target.checked)} /> Active offer</label>
                </div>
                {requestError && !Object.keys(errors).length && <p className="admin-form-error">{requestError}</p>}
                <div className="admin-modal-actions"><button type="button" className="admin-button secondary" onClick={() => navigate("/mittyco-dashboard/offers")}><FiArrowLeft /> Cancel</button><button className="admin-button primary" disabled={saving}><FiSave /> {saving ? "Saving..." : "Save offer"}</button></div>
            </form>
        </section>
    </div>;
}
