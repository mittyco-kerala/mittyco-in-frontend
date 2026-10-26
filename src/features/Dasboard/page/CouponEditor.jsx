import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FiArrowLeft, FiPlus, FiSave, FiSearch } from "react-icons/fi";
import { createResource, getErrorMessage, getResource, listResource, updateResource } from "../services/adminApi";
import { LoadingState } from "../components/AdminPrimitives";
import "../styles/HeroBannerEditor.css";

const emptyCoupon = {
    code: "",
    applicability_type: "PRODUCT",
    products: [],
    category: "",
    discount_type: "PERCENTAGE",
    discount_percentage: "",
    fixed_amount: "",
    start_date: "",
    end_date: "",
    is_active: true,
};

const idOf = (row) => row?.id ?? row?.pk ?? row?.uuid;
const valueId = (value) => String(idOf(value) ?? value ?? "");
const labelOf = (row, fallback = "") => row?.name || row?.title || row?.label || row?.code || fallback || `Product ${idOf(row)}`;
const rowsFromPayload = (payload) => Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
const uniqueRows = (rows) => Array.from(new Map(rows.filter((row) => idOf(row) != null).map((row) => [String(idOf(row)), row])).values());
const errorMap = (error) => {
    const data = error?.response?.data;
    if (!data || typeof data !== "object") return {};
    const format = (value) => Array.isArray(value) ? value.map(format).join(", ") : value && typeof value === "object" ? Object.values(value).map(format).join(" ") : String(value);
    return Object.fromEntries(Object.entries(data).filter(([key]) => key !== "detail" && key !== "message").map(([key, value]) => [key, format(value)]));
};
const pad = (value) => String(value).padStart(2, "0");

function toLocalDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function decimalValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : null;
}

function fieldError(errors, ...names) {
    return names.map((name) => errors[name]).find(Boolean);
}

function normalizeCoupon(row) {
    const category = valueId(row.category ?? row.category_id);
    const applicabilityType = String(row.applicability_type || (category ? "CATEGORY" : "PRODUCT")).toUpperCase();
    const discountType = String(row.discount_type || ((row.fixed_amount !== null && row.fixed_amount !== undefined) ? "FIXED" : "PERCENTAGE")).toUpperCase();
    return {
        code: row.code || "",
        applicability_type: applicabilityType === "CATEGORY" ? "CATEGORY" : "PRODUCT",
        products: Array.from(new Set((Array.isArray(row.products) ? row.products : []).map(valueId).filter(Boolean))),
        category,
        discount_type: discountType === "FIXED" ? "FIXED" : "PERCENTAGE",
        discount_percentage: row.discount_percentage ?? (discountType === "PERCENTAGE" ? row.discount_value ?? "" : ""),
        fixed_amount: row.fixed_amount ?? (discountType === "FIXED" ? row.discount_value ?? "" : ""),
        start_date: toLocalDateTime(row.start_date || row.valid_from),
        end_date: toLocalDateTime(row.end_date || row.valid_until),
        is_active: row.is_active !== false,
    };
}

export default function CouponEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const editing = Boolean(id);
    const [values, setValues] = useState(emptyCoupon);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
    const [productCache, setProductCache] = useState({});
    const [productsLoading, setProductsLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [requestError, setRequestError] = useState("");

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedProductSearch(productSearch.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [productSearch]);

    useEffect(() => {
        let active = true;
        const params = { page_size: 500 };
        if (debouncedProductSearch) params.search = debouncedProductSearch;
        const request = listResource("products", params).catch((error) => {
            if (!debouncedProductSearch) return Promise.reject(error);
            return listResource("products", { page_size: 500 });
        });
        request.then((response) => {
            if (!active) return;
            const rows = uniqueRows(rowsFromPayload(response.data));
            setProducts(rows);
            setProductCache((current) => ({ ...current, ...Object.fromEntries(rows.map((product) => [String(idOf(product)), product])) }));
        }).catch(() => { if (active) setProducts([]); }).finally(() => { if (active) setProductsLoading(false); });
        return () => { active = false; };
    }, [debouncedProductSearch]);

    useEffect(() => {
        let active = true;
        listResource("categories", { page_size: 500 }).then((response) => {
            if (active) setCategories(uniqueRows(rowsFromPayload(response.data)));
        }).catch(() => { if (active) setCategories([]); }).finally(() => { if (active) setCategoriesLoading(false); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        let active = true;
        if (!editing) return () => { active = false; };
        getResource("coupons", id).then((response) => {
            const row = response.data || {};
            const nextValues = normalizeCoupon(row);
            const embeddedProducts = (Array.isArray(row.products) ? row.products : []).filter((product) => product && typeof product === "object" && idOf(product) != null);
            if (!active) return;
            setValues(nextValues);
            setProductCache((current) => ({ ...current, ...Object.fromEntries(embeddedProducts.map((product) => [String(idOf(product)), product])) }));

            const missingProducts = nextValues.products.filter((productId) => !embeddedProducts.some((product) => String(idOf(product)) === productId));
            Promise.all(missingProducts.map((productId) => getResource("products", productId).then((productResponse) => productResponse.data).catch(() => null))).then((fetchedProducts) => {
                if (!active) return;
                const fetchedRows = fetchedProducts.filter(Boolean);
                if (fetchedRows.length) setProductCache((current) => ({ ...current, ...Object.fromEntries(fetchedRows.map((product) => [String(idOf(product)), product])) }));
            });
        }).catch((error) => { if (active) setRequestError(getErrorMessage(error, "Could not load coupon.")); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [editing, id]);

    const setValue = (name, value) => setValues((current) => ({ ...current, [name]: value }));
    const changeApplicability = (applicability_type) => setValues((current) => ({ ...current, applicability_type, products: applicability_type === "CATEGORY" ? [] : current.products, category: applicability_type === "PRODUCT" ? "" : current.category }));
    const changeDiscountType = (discount_type) => setValues((current) => ({ ...current, discount_type, discount_percentage: discount_type === "FIXED" ? "" : current.discount_percentage, fixed_amount: discount_type === "PERCENTAGE" ? "" : current.fixed_amount }));
    const addProduct = (productId) => {
        const normalizedId = String(productId);
        setValues((current) => current.products.some((value) => String(value) === normalizedId) ? current : { ...current, products: [...current.products.map(String), normalizedId] });
        setProductSearch("");
    };
    const removeProduct = (productId) => setValues((current) => ({ ...current, products: current.products.filter((value) => String(value) !== String(productId)) }));

    const selectedProductIds = useMemo(() => new Set(values.products.map((value) => String(value))), [values.products]);
    const searchQuery = productSearch.trim().toLowerCase();
    const availableProducts = products
        .filter((product) => !selectedProductIds.has(String(idOf(product))))
        .filter((product) => !searchQuery || [labelOf(product), product.name, product.title, product.code, product.sku, product.product_code].filter(Boolean).join(" ").toLowerCase().includes(searchQuery));

    const validate = () => {
        const next = {};
        const code = values.code.trim();
        if (code && !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(code)) next.code = "Use letters, numbers, hyphens, or underscores only.";
        if (values.applicability_type === "PRODUCT" && values.products.length === 0) next.products = "Select at least one product.";
        if (values.applicability_type === "CATEGORY" && !values.category) next.category = "Select a category.";
        if (values.discount_type === "PERCENTAGE") {
            if (values.discount_percentage === "" || Number(values.discount_percentage) <= 0 || Number(values.discount_percentage) > 100) next.discount_percentage = "Enter a percentage greater than 0 and at most 100.";
        } else if (values.fixed_amount === "" || Number(values.fixed_amount) <= 0) next.fixed_amount = "Enter a fixed amount greater than 0.";
        if (!values.start_date) next.start_date = "Start date is required.";
        if (!values.end_date) next.end_date = "Expiry date is required.";
        if (values.start_date && values.end_date && new Date(values.end_date) <= new Date(values.start_date)) next.end_date = "Expiry date must be after the start date.";
        return next;
    };

    const save = async (mode = "list") => {
        if (saving) return;
        const validation = validate();
        if (Object.keys(validation).length) {
            setErrors(validation);
            setRequestError("Please correct the highlighted fields.");
            return;
        }
        setSaving(true);
        setErrors({});
        setRequestError("");
        const isProductCoupon = values.applicability_type === "PRODUCT";
        const isPercentage = values.discount_type === "PERCENTAGE";
        const payload = {
            applicability_type: values.applicability_type,
            products: isProductCoupon ? values.products.map((productId) => Number(productId) || productId) : [],
            category: isProductCoupon ? null : (Number(values.category) || values.category),
            discount_type: values.discount_type,
            discount_percentage: isPercentage ? decimalValue(values.discount_percentage) : null,
            fixed_amount: isPercentage ? null : decimalValue(values.fixed_amount),
            start_date: toIsoDateTime(values.start_date),
            end_date: toIsoDateTime(values.end_date),
            is_active: Boolean(values.is_active),
        };
        if (values.code.trim()) payload.code = values.code.trim();
        try {
            const response = editing ? await updateResource("coupons", id, payload) : await createResource("coupons", payload);
            const savedId = id || idOf(response.data);
            toast.success(editing ? "Coupon updated" : "Coupon created");
            if (mode === "another") { setValues({ ...emptyCoupon }); navigate("/mittyco-dashboard/coupons/new", { replace: true }); }
            else if (mode === "continue") navigate(`/mittyco-dashboard/coupons/${savedId}/edit`, { replace: true });
            else navigate("/mittyco-dashboard/coupons");
        } catch (error) {
            const nextErrors = errorMap(error);
            setErrors(nextErrors);
            setRequestError(Object.keys(nextErrors).length ? "Please correct the highlighted fields." : getErrorMessage(error, "Could not save coupon."));
            toast.error(getErrorMessage(error, "Could not save coupon."));
        } finally { setSaving(false); }
    };

    if (loading) return <div className="admin-page"><LoadingState label="Loading coupon..." /></div>;
    const productError = fieldError(errors, "products", "product");
    const categoryError = fieldError(errors, "category");
    const percentageError = fieldError(errors, "discount_percentage", "discount");
    const fixedError = fieldError(errors, "fixed_amount");
    return <div className="hero-banner-editor-page coupon-editor-page">
        <div className="hero-editor-heading"><div><button type="button" className="hero-back-link" onClick={() => navigate("/mittyco-dashboard/coupons")}><FiArrowLeft /> Coupons</button><h2>{editing ? "Edit coupon" : "Add coupon"}</h2></div><div className="hero-breadcrumb">Home&nbsp; / &nbsp;Myapp&nbsp; / &nbsp;Coupons&nbsp; / &nbsp;{editing ? "Edit coupon" : "Add coupon"}</div></div>
        <div className="hero-editor-layout"><section className="hero-editor-card"><form className="hero-editor-form" onSubmit={(event) => { event.preventDefault(); save("list"); }}>
            <label className={`hero-editor-field ${errors.code ? "has-error" : ""}`}><span>Coupon code</span><input type="text" autoFocus value={values.code} onChange={(event) => setValue("code", event.target.value)} placeholder="e.g. SAVE10" autoComplete="off" />{errors.code ? <small>{errors.code}</small> : <small className="hero-field-help">Leave blank to let the backend generate a code.</small>}</label>
            <fieldset className="coupon-choice-field"><legend>Apply coupon to <em>*</em></legend><label><input type="radio" name="applicability_type" checked={values.applicability_type === "PRODUCT"} onChange={() => changeApplicability("PRODUCT")} /> Product</label><label><input type="radio" name="applicability_type" checked={values.applicability_type === "CATEGORY"} onChange={() => changeApplicability("CATEGORY")} /> Category</label><small>Choose whether this coupon applies to selected products or a whole category.</small></fieldset>
            {values.applicability_type === "PRODUCT" && <div className={`hero-editor-field ${productError ? "has-error" : ""}`}><span>Products <em>*</em></span><div className="coupon-products"><div className="coupon-product-picker"><div className="coupon-product-search"><FiSearch aria-hidden="true" /><input type="search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products" aria-label="Search products" /></div><select value="" disabled={productsLoading} onChange={(event) => { if (event.target.value) addProduct(event.target.value); }} aria-label="Select a product"><option value="">{productsLoading ? "Loading products..." : "Select products"}</option>{availableProducts.map((product) => <option key={idOf(product)} value={idOf(product)}>{labelOf(product)}</option>)}</select><button type="button" className="coupon-add-product" title="Add product" onClick={() => navigate("/mittyco-dashboard/products/new")}><FiPlus /></button></div>{searchQuery && <div className="coupon-product-results" role="listbox" aria-label="Product search results">{productsLoading ? <p className="coupon-product-empty">Searching products...</p> : availableProducts.length > 0 ? availableProducts.slice(0, 8).map((product) => <button type="button" className="coupon-product-result" role="option" key={idOf(product)} onClick={() => addProduct(idOf(product))}><span>{labelOf(product)}</span>{(product.sku || product.code || product.product_code) && <small>{product.sku || product.code || product.product_code}</small>}</button>) : <p className="coupon-product-empty">No products found</p>}</div>}{values.products.length > 0 && <div className="coupon-selected-products">{values.products.map((productId) => { const product = productCache[String(productId)] || products.find((item) => String(idOf(item)) === String(productId)); return <button type="button" key={productId} onClick={() => removeProduct(productId)}>{labelOf(product || { id: productId }, `Product ${productId}`)} ×</button>; })}</div>}{productError ? <small>{productError}</small> : <small className="hero-field-help">Select one or more products. Product IDs are submitted as an array.</small>}</div></div>}
            {values.applicability_type === "CATEGORY" && <label className={`hero-editor-field ${categoryError ? "has-error" : ""}`}><span>Category <em>*</em></span><select value={values.category} onChange={(event) => setValue("category", event.target.value)} disabled={categoriesLoading}><option value="">{categoriesLoading ? "Loading categories..." : "Select category"}</option>{categories.map((category) => <option key={idOf(category)} value={idOf(category)}>{labelOf(category, `Category ${idOf(category)}`)}</option>)}</select>{categoryError && <small>{categoryError}</small>}</label>}
            <fieldset className="coupon-choice-field"><legend>Discount type <em>*</em></legend><label><input type="radio" name="discount_type" checked={values.discount_type === "PERCENTAGE"} onChange={() => changeDiscountType("PERCENTAGE")} /> Percentage</label><label><input type="radio" name="discount_type" checked={values.discount_type === "FIXED"} onChange={() => changeDiscountType("FIXED")} /> Fixed amount</label></fieldset>
            {values.discount_type === "PERCENTAGE" ? <label className={`hero-editor-field ${percentageError ? "has-error" : ""}`}><span>Discount percentage <em>*</em></span><input type="number" min="0.01" max="100" step="0.01" value={values.discount_percentage} onChange={(event) => setValue("discount_percentage", event.target.value)} placeholder="10" />{percentageError && <small>{percentageError}</small>}</label> : <label className={`hero-editor-field ${fixedError ? "has-error" : ""}`}><span>Fixed amount <em>*</em></span><input type="number" min="0.01" step="0.01" value={values.fixed_amount} onChange={(event) => setValue("fixed_amount", event.target.value)} placeholder="500.00" />{fixedError && <small>{fixedError}</small>}</label>}
            <label className={`hero-editor-field ${errors.start_date ? "has-error" : ""}`}><span>Start date <em>*</em></span><input type="datetime-local" value={values.start_date} onChange={(event) => setValue("start_date", event.target.value)} />{errors.start_date && <small>{errors.start_date}</small>}</label>
            <label className={`hero-editor-field ${errors.end_date ? "has-error" : ""}`}><span>Expiry date <em>*</em></span><input type="datetime-local" value={values.end_date} onChange={(event) => setValue("end_date", event.target.value)} />{errors.end_date && <small>{errors.end_date}</small>}</label>
            <label className="hero-editor-field"><span>Active status</span><input type="checkbox" checked={Boolean(values.is_active)} onChange={(event) => setValue("is_active", event.target.checked)} /><small className="hero-field-help">Inactive coupons cannot be applied to new orders.</small></label>
            {requestError && <p className="hero-editor-error" role="alert">{requestError}</p>}
            <div className="coupon-form-actions"><button type="submit" className="hero-save-button" disabled={saving}><FiSave /> {saving ? "Saving..." : "Save"}</button><button type="button" className="hero-secondary-button" onClick={() => save("another")} disabled={saving}>Save and add another</button><button type="button" className="hero-secondary-button" onClick={() => save("continue")} disabled={saving}>Save and continue editing</button></div>
        </form></section></div>
    </div>;
}
