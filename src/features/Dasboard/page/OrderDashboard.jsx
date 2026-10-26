import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FiActivity, FiArchive, FiBox, FiChevronDown, FiClipboard, FiCopy, FiCreditCard, FiDownload, FiEdit3, FiEye, FiGrid, FiImage, FiLayers, FiLogOut, FiMenu, FiPackage, FiPlus, FiPower, FiRefreshCw, FiSettings, FiShield, FiShoppingBag, FiTag, FiToggleLeft, FiToggleRight, FiTrash2, FiTruck, FiUsers, FiX } from "react-icons/fi";
import { ConfirmDialog, DataTable, DebouncedSearch, EmptyState, ErrorState, FilterBar, FormField, LoadingState, Modal, PageHeader, Pagination, Skeleton, StatusPill } from "../components/AdminPrimitives";
import useAdminResource from "../hooks/useAdminResource";
import OverviewGraphs from "../components/OverviewGraphs";
import useFormErrors from "../hooks/useFormErrors";
import { createResource, deleteResource, duplicateResource, getErrorMessage, getFieldSchema, getOrderDetails, getResource, listResource, unwrapList, updateOrderDetails, updateResource } from "../services/adminApi";
import ProductView from "./ProductView";
import ProductEditor from "./ProductEditor";
import HeroBannerEditor from "./HeroBannerEditor";
import PromoBannerEditor from "./PromoBannerEditor";
import HeroSideBannerEditor from "./HeroSideBannerEditor";
import CouponEditor from "./CouponEditor";
import CouponUsageEditor from "./CouponUsageEditor";
import WelcomeBonusEditor from "./WelcomeBonusEditor";
import WelcomeBonusPage from "./WelcomeBonusPage";
import TokenBlacklistPage from "./TokenBlacklistPage";
import navbarLogo from "../../../assets/mittyco/mittyco-logo-transparent-dark.png";
import { getImageUrl } from "../../../utils/imageUrl";
import { logoutSession } from "../../../lib/ApiClient";
import { getPasswordPolicyError } from "../../auth/passwordPolicy";
import { getAuthValue } from "../../auth/authUtils";
import DirhamAmount from "../../../components/DirhamAmount";
import "../styles/AdminDashboard.css";
import "../styles/LogoutTheme.css";
import "../styles/AdminPolish.css";

const resources = {
    users: { label: "Users", group: "Customers", fields: ["email", "password", "first_name", "last_name", "role", "is_staff", "is_active"], columns: ["email", "first_name", "last_name", "role", "last_login", "is_active"] },
    categories: { label: "Categories", group: "Catalog", fields: ["name", "image", "is_active"], columns: ["name", "image", "is_active"] },
    subcategories: { label: "Subcategories", group: "Catalog", fields: ["category", "name", "image", "is_active"], columns: ["id", "category", "name", "image", "is_active"] },
    offers: { label: "Offers", group: "Catalog", fields: ["title", "description", "image", "discount_percentage", "start_date", "end_date", "is_active"], columns: ["title", "discount_percentage", "start_date", "end_date", "is_active"] },
    brands: { label: "Brands", itemLabel: "Brand", group: "Catalog", fields: ["name", "logo", "is_active"], columns: ["name", "logo", "is_active"] },
    colors: { label: "Colors", group: "Catalog", fields: ["name", "code"], columns: ["name", "code"] },
    "unit-types": { label: "Unit Types", group: "Catalog", fields: ["name"], columns: ["name"] },
    units: { label: "Units", group: "Catalog", fields: ["unit_type", "name"], columns: ["unit_type", "name"] },
    products: { label: "Products", group: "Catalog", fields: ["name", "description", "key_features", "category", "subcategory", "offer", "seller_name", "shipping_fee", "estimated_delivery_time", "warranty_info", "current_viewers_count", "promotional_banner_image", "promotional_banner_link", "is_active"], columns: ["id", "name", "category", "subcategory", "product_image", "seller_name", "is_active"] },
    "product-variants": { label: "Product Variants", group: "Catalog", fields: ["product", "color", "sku", "price_type", "price", "stock"], columns: ["product", "color", "sku", "price_type", "price", "stock"] },
    "product-highlights": { label: "Product Highlights", itemLabel: "Product Highlight", group: "Marketing", fields: ["product", "highlight_type", "text", "icon_key", "background_color", "text_color", "ends_at", "display_order", "rotation_seconds", "is_active"], columns: ["product", "highlight_type", "text", "icon_key", "background_color", "text_color", "display_order", "rotation_seconds", "is_active"] },
    "product-messages": { label: "Product Messages", itemLabel: "Product Message", group: "Marketing", fields: ["product", "message_type", "text", "background_color", "text_color", "ends_at", "display_order", "rotation_seconds", "is_active"], columns: ["product", "message_type", "text", "background_color", "text_color", "display_order", "rotation_seconds", "is_active"] },
    "product-variant-units": { label: "Variant Sizes / Units", group: "Catalog", fields: ["variant", "unit_type", "unit", "sku", "price", "stock"], columns: ["variant", "unit_type", "unit", "sku", "price", "stock"] },
    "product-images": { label: "Product Images", group: "Catalog", fields: ["variant", "image", "is_primary", "position"], columns: ["variant", "image", "is_primary", "position"] },
    wishlists: { label: "Wishlists", group: "Customers", fields: ["user", "variant", "variant_unit"], columns: ["user", "variant", "variant_unit"] },
    carts: { label: "Carts", group: "Customers", fields: ["user", "variant", "variant_unit", "quantity", "coupon"], columns: ["user", "variant", "variant_unit", "quantity"] },
    addresses: { label: "Addresses", group: "Customers", fields: ["user", "full_name", "phone", "address_line", "city", "postal_code", "country", "is_default"], columns: ["user", "full_name", "phone", "city", "postal_code", "is_default"] },
    "user-profiles": { label: "User Profiles", group: "Customers", fields: ["user", "phone", "date_of_birth", "gender"], columns: ["user", "phone", "date_of_birth", "gender"] },
    orders: { label: "Orders", group: "Orders", fields: ["user", "address", "customer_name", "subtotal", "discount_amount", "shipping_charge", "total_amount", "payment_status", "status", "created_at"], columns: ["customer_name", "total_amount", "payment_status", "status", "created_at"] },
    "order-items": { label: "Order Items", group: "Orders", fields: ["order", "product", "color", "unit", "quantity", "original_price", "variant_unit", "discount_amount", "price", "total_price"], columns: ["order", "product", "quantity", "price", "total_price"] },
    "hero-banners": { label: "Hero Banners", group: "Marketing", fields: ["subtitle", "title", "description", "image", "button_text", "display_order", "is_active"], columns: ["subtitle", "title", "button_text", "display_order", "is_active"] },
    "promo-banners": { label: "Promotional Banners", group: "Marketing", fields: ["image", "link", "is_active"], columns: ["image", "link", "is_active"] },
    "hero-side-banners": { label: "Hero Side Banners", group: "Marketing", fields: ["image", "link", "is_active"], columns: ["image", "link", "is_active"] },
    "trust-benefits": { label: "Trust & Benefits", itemLabel: "Benefit", group: "Marketing", fields: ["key", "title", "description", "icon_key", "display_order", "is_active"], columns: ["display_order", "key", "title", "icon_key", "is_active"] },
    coupons: { label: "Coupons", group: "Marketing", fields: ["code", "applicability_type", "target_name", "discount_type", "discount_value", "start_date", "end_date", "is_active"], columns: ["code", "applicability_type", "target_name", "discount_type", "discount_value", "start_date", "end_date", "is_active", "product", "category"] },
    "welcome-bonuses": { label: "Welcome Bonuses", group: "Dashboard", fields: [], columns: [] },
    "coupon-usages": { label: "Coupon Usage History", group: "Marketing", fields: ["coupon", "user", "product", "used_at"], columns: ["user", "coupon", "product", "used_at"] },
    "token-blacklist/outstanding-tokens": { label: "Outstanding Tokens", group: "Token Blacklist", fields: [], columns: [] },
    "token-blacklist/blacklisted-tokens": { label: "Blacklisted Tokens", group: "Token Blacklist", fields: [], columns: [] },
};

const navGroups = [
    { title: "Workspace", items: [{ key: "overview", label: "Overview", icon: FiGrid }] },
    { title: "Orders", items: [{ key: "orders", label: "Orders", icon: FiShoppingBag }, { key: "order-items", label: "Order Items", icon: FiClipboard }] },
    { title: "Catalog", items: ["categories", "subcategories", "brands", "products", "colors", "unit-types", "units", "offers"].map((key) => ({ key, label: key === "products" ? "Products & Variants" : resources[key].label, icon: key === "products" ? FiPackage : FiLayers })) },
    { title: "Customers", items: ["users", "user-profiles", "addresses", "wishlists", "carts"].map((key) => ({ key, label: resources[key].label, icon: key === "users" ? FiUsers : FiArchive })) },
    { title: "Dashboard", items: ["coupons", "welcome-bonuses"].map((key) => ({ key, label: resources[key].label, icon: FiTag })) },
    { title: "Token Blacklist", items: [{ key: "token-blacklist/outstanding-tokens", label: "Outstanding Tokens", icon: FiShield }, { key: "token-blacklist/blacklisted-tokens", label: "Blacklisted Tokens", icon: FiArchive }] },
    { title: "Marketing", items: ["hero-banners", "promo-banners", "hero-side-banners", "trust-benefits", "coupon-usages"].map((key) => ({ key, label: resources[key].label, icon: key === "trust-benefits" ? FiShield : key.includes("banner") ? FiImage : FiTag })) },
    { title: "Product Tags", items: ["product-highlights", "product-messages"].map((key) => ({ key, label: key === "product-highlights" ? "Product Tags" : resources[key].label, icon: key === "product-highlights" ? FiActivity : FiTruck })) },
];

const TRUST_BENEFIT_ICON_OPTIONS = [
    ["secure-payment", "Secure payment"],
    ["delivery-information", "Delivery information"],
    ["customer-support", "Customer support"],
    ["easy-returns", "Easy returns"],
];

const money = (value) => <DirhamAmount value={Number(value || 0)} useGrouping />;
const date = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const titleize = (value = "") => value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const columnLabel = (resource, key) => ({
    subcategories: { id: "Subcategory ID", category: "Category Name", name: "Subcategory Name" },
    products: { id: "Product ID", name: "Product Name", category: "Category Name", subcategory: "Subcategory Name", product_image: "Product Image" },
    orders: { customer_name: "Customer" },
}[resource]?.[key] || titleize(key));
const fallbackFields = (resource, fieldNames) => fieldNames.map((name) => ({ name, type: name.includes("description") ? "textarea" : name.includes("active") ? "boolean" : resource === "offers" && ["start_date", "end_date"].includes(name) ? "date" : resource === "offers" && name === "discount" ? "number" : "text", label: resource === "offers" && name === "discount" ? "Discount (%)" : titleize(name), ...(resource === "offers" && name === "discount" ? { min: 0, max: 100, step: 0.01 } : {}) }));
const resourceFallbackFields = (resource, fieldNames) => {
    const fields = fallbackFields(resource, fieldNames);
    if (["product-highlights", "product-messages"].includes(resource)) {
        return fields.map((field) => field.name === "background_color" ? { ...field, type: "color", label: "Background color" } : field.name === "text_color" ? { ...field, type: "color", label: "Font color" } : field);
    }
    if (resource !== "trust-benefits") return fields;
    return fields.map((field) => {
        if (field.name === "icon_key") return { ...field, type: "choice", choices: TRUST_BENEFIT_ICON_OPTIONS, label: "Icon" };
        if (field.name === "display_order") return { ...field, type: "integer", label: "Display order", min: 0, step: 1 };
        return field;
    });
};
const recordId = (row) => row?.id ?? row?.pk ?? row?.uuid;
const itemLabel = (resource) => resources[resource]?.itemLabel || resources[resource]?.label?.replace(/s$/, "") || "Record";
const recordLabel = (value) => typeof value === "object" ? value?.name || value?.title || value?.email || value?.id || "—" : value;

const couponApplyTo = (row) => String(row?.applicability_type || (row?.category ? "CATEGORY" : "PRODUCT")).toUpperCase() === "CATEGORY" ? "Category" : "Product";
const couponTarget = (row, references = {}) => {
    if (row?.target_name || row?.category_name) return row.target_name || row.category_name;
    if (couponApplyTo(row) === "Category") {
        const categoryId = row?.category?.id ?? row?.category;
        return recordLabel((references.categories || []).find((item) => String(recordId(item)) === String(categoryId)) || row?.category) || "—";
    }
    const products = Array.isArray(row?.products) ? row.products : [];
    const labels = products.map((product) => recordLabel((references.products || []).find((item) => String(recordId(item)) === String(product?.id ?? product)) || product)).filter(Boolean);
    return labels.length ? labels.join(", ") : "—";
};
const couponDiscount = (row) => {
    const type = String(row?.discount_type || "").toUpperCase();
    if (type === "FIXED" || (row?.fixed_amount !== null && row?.fixed_amount !== undefined && row?.fixed_amount !== "")) {
        const amount = row?.fixed_amount ?? row?.discount_value;
        return amount === null || amount === undefined || amount === "" ? "—" : <DirhamAmount value={amount} useGrouping />;
    }
    const percentage = row?.discount_percentage ?? row?.discount_value;
    return percentage === null || percentage === undefined || percentage === "" ? "—" : `${percentage}%`;
};

function fieldsFromSchema(schema, resource) {
    const raw = getFieldSchema(schema, resource);
    const fieldList = Array.isArray(raw) ? raw : raw?.fields || Object.entries(raw || {}).map(([name, config]) => ({ name, ...(typeof config === "object" ? config : { type: config }) }));
    const fields = fieldList.filter((field) => {
        const name = field.name || field.key;
        if (resource === "products" && ["emi_available", "emi_starting_price"].includes(name)) return false;
        if (resource === "products" && ["product_type", "has_variants"].includes(name)) return false;
        // Brand slugs are generated by the API from the brand name. They are
        // read-only implementation details and should never be shown in the
        // dashboard create/edit form.
        if (resource === "brands" && name === "slug") return false;
        if (resource === "users" && ["last_login", "date_joined", "groups", "user_permissions"].includes(name)) return false;
        if (resource === "categories" && !["name", "image", "is_active"].includes(name)) return false;
        if (resource === "subcategories" && !["category", "name", "image", "is_active"].includes(name)) return false;
        if (resource === "unit-types" && name !== "name") return false;
        if (resource === "units" && !["unit_type", "name"].includes(name)) return false;
        if (resource === "product-variants" && !["product", "color", "sku", "price_type", "price", "stock"].includes(name)) return false;
        if (resource === "product-variant-units" && !["variant", "unit_type", "unit", "sku", "price", "stock"].includes(name)) return false;
        if (resource === "product-images" && !["variant", "image", "is_primary", "position"].includes(name)) return false;
        return name && !["id", "pk", "created_at", "updated_at", "created", "updated"].includes(name) && !field.read_only;
    });
    if (resource === "users" && !fields.some((field) => (field.name || field.key) === "password")) {
        fields.splice(1, 0, { name: "password", type: "password", label: "Password", password_policy: true });
    }
    if (resource === "trust-benefits") {
        return fields.map((field) => {
            const name = field.name || field.key;
            if (name === "icon_key") return { ...field, type: "choice", choices: TRUST_BENEFIT_ICON_OPTIONS, label: "Icon" };
            if (name === "display_order") return { ...field, type: "integer", label: "Display order", min: 0, step: 1 };
            return field;
        });
    }
    if (["product-highlights", "product-messages"].includes(resource)) {
        return fields.map((field) => {
            const name = field.name || field.key;
            if (name === "background_color") return { ...field, type: "color", label: "Background color" };
            if (name === "text_color") return { ...field, type: "color", label: "Font color" };
            return field;
        });
    }
    return fields;
}

function displayValue(row, key, references = []) {
    const value = row?.[key];
    if (value === null || value === undefined || value === "") return "—";
    if (key === "unit_type" && references.length) {
        const reference = references.find((item) => String(recordId(item)) === String(value?.id ?? value));
        return reference ? recordLabel(reference) : recordLabel(value);
    }
    if (key.includes("image")) return typeof value === "string" ? <img className="table-image-thumb" src={getImageUrl(value)} alt="" /> : recordLabel(value);
    if (key === "discount_value") return String(row?.discount_type || "").toUpperCase() === "FIXED" ? <DirhamAmount value={value} /> : `${value}%`;
    if (key.includes("percentage")) return `${value}%`;
    if (key.includes("amount") || key.includes("price") || key.includes("discount_value") || key.includes("shipping_fee") || key.includes("shipping_charge")) return money(value);
    if (key.includes("date") || key.endsWith("_at") || key === "valid_until" || key === "valid_from") return date(value);
    if (key.includes("status") || key === "is_active" || key === "is_staff" || key === "is_default") return <StatusPill value={typeof value === "boolean" ? (value ? "Active" : "Inactive") : value} />;
    return recordLabel(value);
}

function resolveTableValue(row, key, references) {
    const referenceName = { user: "users", customer: "users", product: "products", variant: "product-variants", variant_unit: "product-variant-units", category: "categories", subcategory: "subcategories", offer: "offers", color: "colors", unit_type: "unit-types", unit: "units", coupon: "coupons", order: "orders", address: "addresses", cancelled_by: "users" }[key];
    if (!referenceName) return displayValue(row, key);
    const value = row?.[key];
    const reference = (references[referenceName] || []).find((item) => String(recordId(item)) === String(value?.id ?? value));
    return displayValue({ [key]: reference || value }, key);
}

function csvValue(value) {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return value.map(csvValue).join("; ");
    if (typeof value === "object") {
        const label = value.name || value.title || value.email || value.code;
        return label ? String(label) : JSON.stringify(value);
    }
    return String(value);
}

function csvEscape(value) {
    const text = csvValue(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv(filename, rows, columns) {
    const header = columns.map((column) => csvEscape(column.label)).join(",");
    const body = rows.map((row) => columns.map((column) => csvEscape(row?.[column.key])).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${header}${body ? `\r\n${body}` : ""}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function flattenForCsv(value, prefix = "", rows = []) {
    if (Array.isArray(value)) {
        if (!value.length) rows.push({ metric: prefix, value: "" });
        value.forEach((item, index) => flattenForCsv(item, `${prefix}[${index + 1}]`, rows));
        return rows;
    }
    if (value && typeof value === "object") {
        Object.entries(value).forEach(([key, item]) => flattenForCsv(item, prefix ? `${prefix}.${key}` : key, rows));
        return rows;
    }
    rows.push({ metric: prefix, value: value ?? "" });
    return rows;
}

function exportColumns(resource, rows) {
    const keys = [...new Set([
        ...rows.flatMap((row) => Object.keys(row || {})),
        ...(resources[resource]?.fields || []),
    ])].filter((key) => key !== "password");
    return keys.map((key) => ({ key, label: columnLabel(resource, key) }));
}

async function fetchAllResourceRows(resource, params = {}) {
    const requestParams = { ...params };
    delete requestParams.page;
    delete requestParams.page_size;
    const allRows = [];
    let page = 1;

    while (page <= 10000) {
        const response = await listResource(resource, { ...requestParams, page, page_size: 500 });
        const normalized = unwrapList(response.data);
        allRows.push(...normalized.rows);
        if (!normalized.next && (!normalized.count || allRows.length >= normalized.count || !normalized.rows.length)) break;
        page += 1;
    }

    return allRows;
}

function CsvButton({ onClick, disabled = false, loading = false }) {
    return <button type="button" className="admin-button secondary" onClick={onClick} disabled={disabled || loading}><FiDownload /> {loading ? "Preparing CSV..." : "Download CSV"}</button>;
}

function AdminHeaderActions({ children }) {
    return <div className="admin-header-actions">{children}</div>;
}

function relatedProductImageMap(variants, images) {
    const variantById = new Map(variants.map((variant) => [String(recordId(variant)), variant]));
    const productImages = new Map();
    images.forEach((image) => {
        const variantId = image?.variant?.id ?? image?.variant;
        const variant = variantById.get(String(variantId));
        const productId = variant?.product?.id ?? variant?.product;
        const imageUrl = typeof image?.image === "string" ? getImageUrl(image.image) : typeof image?.url === "string" ? getImageUrl(image.url) : null;
        if (!productId || !imageUrl) return;
        if (!productImages.has(String(productId)) || image.is_primary) productImages.set(String(productId), imageUrl);
    });
    return productImages;
}

export default function OrderDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const { id: detailId, mode: routeMode } = useParams();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [schema, setSchema] = useState({});
    const [overview, setOverview] = useState({});
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const dashboardPath = location.pathname.replace(/^\/mittyco-dashboard\/?/, "");
    const pathKey = dashboardPath.startsWith("token-blacklist/") ? dashboardPath.split("/").slice(0, 2).join("/") : dashboardPath.split("/")[0] || "overview";
    const isEditRoute = routeMode === "edit" || location.pathname.endsWith("/edit");
    const isProductEditor = pathKey === "products" && (location.pathname.endsWith("/new") || isEditRoute);
    const isProductView = pathKey === "products" && Boolean(detailId) && !isProductEditor;
    const isHeroBannerEditor = pathKey === "hero-banners" && (location.pathname.endsWith("/new") || isEditRoute);
    const isPromoBannerEditor = pathKey === "promo-banners" && (location.pathname.endsWith("/new") || isEditRoute);
    const isHeroSideBannerEditor = pathKey === "hero-side-banners" && (location.pathname.endsWith("/new") || isEditRoute);
    const isCouponEditor = pathKey === "coupons" && (location.pathname.endsWith("/new") || isEditRoute);
    const isCouponUsageEditor = pathKey === "coupon-usages" && (location.pathname.endsWith("/new") || isEditRoute);
    const isWelcomeBonusEditor = pathKey === "welcome-bonuses" && (location.pathname.endsWith("/new") || isEditRoute);
    const isWelcomeBonusView = pathKey === "welcome-bonuses" && Boolean(detailId) && location.pathname.endsWith("/view");
    const isTrustBenefitEditor = pathKey === "trust-benefits" && (location.pathname.endsWith("/new") || isEditRoute);
    const isProductHighlightEditor = pathKey === "product-highlights" && (location.pathname.endsWith("/new") || isEditRoute);
    const isProductMessageEditor = pathKey === "product-messages" && (location.pathname.endsWith("/new") || isEditRoute);
    const isOrderEditor = pathKey === "orders" && Boolean(detailId) && isEditRoute;
    const isGenericEditPage = Boolean(detailId) && isEditRoute && Boolean(resources[pathKey]) && !["products", "orders", "hero-banners", "promo-banners", "hero-side-banners", "coupons", "coupon-usages", "welcome-bonuses", "trust-benefits"].includes(pathKey);
    const isReadOnlyResourceView = Boolean(detailId) && !isEditRoute && pathKey !== "products" && pathKey !== "orders" && pathKey !== "welcome-bonuses" && Boolean(resources[pathKey]);

    useEffect(() => {
        const onForbidden = () => setForbidden(true);
        window.addEventListener("api:forbidden", onForbidden);
        return () => window.removeEventListener("api:forbidden", onForbidden);
    }, []);

    const loadDashboard = useCallback(async () => {
        setOverviewLoading(true);
        const [schemaResult, overviewResult] = await Promise.allSettled([listResource("schema"), listResource("overview")]);
        if (schemaResult.status === "fulfilled") setSchema(schemaResult.value.data);
        if (overviewResult.status === "fulfilled") setOverview(overviewResult.value.data || {});
        else setOverview({ __error: getErrorMessage(overviewResult.reason, "Could not load dashboard overview.") });
        setOverviewLoading(false);
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => { void loadDashboard(); }, 0);
        return () => window.clearTimeout(timer);
    }, [loadDashboard]);

    const go = (key) => { setSidebarOpen(false); navigate(key === "overview" ? "/mittyco-dashboard" : `/mittyco-dashboard/${key}`); };
    const logout = async () => { await logoutSession(); navigate("/login", { replace: true }); };
    const refreshDashboard = () => { if (refreshing) return; setRefreshing(true); window.setTimeout(() => window.location.reload(), 220); };
    const currentTitle = pathKey === "overview" ? "Overview" : resources[pathKey]?.label || "Admin Dashboard";

    return <div className="admin-app">
        <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="admin-brand"><span className="admin-brand-logo" aria-label="Mittyco"><img src={navbarLogo} alt="Mittyco" /></span><button type="button" className="admin-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><FiX aria-hidden="true" /></button></div>
            <nav className="admin-nav">{navGroups.map((group) => <div key={group.title}><p className="admin-nav-label">{group.title}</p>{group.items.map(({ key, label, icon: Icon }) => <button key={key} className={`admin-nav-item ${pathKey === key ? "active" : ""}`} onClick={() => go(key)}><Icon /><span>{label}</span></button>)}</div>)}</nav>
            <div className="admin-sidebar-footer"><div className="admin-user"><span>{(getAuthValue("first_name") || "S").slice(0, 1).toUpperCase()}</span><div><strong>{getAuthValue("first_name") || "Super Admin"}</strong><small>Super Admin</small></div></div><button className="admin-nav-item admin-logout-button" onClick={logout}><FiLogOut /><span>Sign out</span></button></div>
        </aside>
        {sidebarOpen && <button className="admin-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}
        <main className="admin-content"><header className="admin-topbar"><button type="button" className="admin-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><FiMenu /></button><div><p className="admin-eyebrow">SUPER ADMIN / {currentTitle.toUpperCase()}</p><h1>{currentTitle}</h1></div><div className="admin-top-actions"><button type="button" className={`admin-button secondary refresh-action ${refreshing ? "is-refreshing" : ""}`} onClick={refreshDashboard} disabled={refreshing} aria-label="Refresh dashboard"><FiRefreshCw aria-hidden="true" /> <span>{refreshing ? "Refreshing..." : "Refresh"}</span></button><FiActivity className="admin-live" title="Live admin workspace" aria-label="Live admin workspace" /></div></header>{forbidden && <div className="admin-access-alert" role="alert"><FiSettings /><span><strong>Super Admin access required</strong><small>Your account does not have permission to access this resource.</small></span><button type="button" onClick={() => setForbidden(false)} aria-label="Dismiss access alert"><FiX /></button></div>}{isProductEditor ? <ProductEditor /> : isProductView ? <ProductView /> : isHeroBannerEditor ? <HeroBannerEditor schema={schema} /> : isPromoBannerEditor ? <PromoBannerEditor /> : isHeroSideBannerEditor ? <HeroSideBannerEditor /> : isCouponEditor ? <CouponEditor /> : isCouponUsageEditor ? <CouponUsageEditor /> : isWelcomeBonusEditor ? <WelcomeBonusEditor /> : isTrustBenefitEditor || isProductHighlightEditor || isProductMessageEditor ? <ResourceEditorPage resource={pathKey} id={isEditRoute ? detailId : undefined} schema={schema} /> : isWelcomeBonusView ? <WelcomeBonusPage /> : isOrderEditor ? <OrderEditPage id={detailId} /> : detailId && pathKey === "orders" ? <OrderDetail id={detailId} /> : isGenericEditPage ? <ResourceEditorPage resource={pathKey} id={detailId} schema={schema} /> : isReadOnlyResourceView ? <ReadOnlyResourcePage resource={pathKey} id={detailId} schema={schema} /> : pathKey === "overview" ? <Overview data={overview} loading={overviewLoading} /> : pathKey === "welcome-bonuses" ? <WelcomeBonusPage /> : pathKey === "token-blacklist/outstanding-tokens" ? <TokenBlacklistPage type="outstanding" /> : pathKey === "token-blacklist/blacklisted-tokens" ? <TokenBlacklistPage type="blacklisted" /> : resources[pathKey] ? <ResourcePage key={pathKey} resource={pathKey} schema={schema} /> : <Overview data={overview} loading={overviewLoading} />}</main>
    </div>;
}

function Overview({ data, loading }) {
    const error = data?.__error;
    if (error && !loading) {
        return <div className="admin-page"><PageHeader eyebrow="OVERVIEW" title="Store overview" description="Your store at a glance â€” products, customers, and order progress." /><ErrorState message={error} onRetry={() => window.location.reload()} /></div>;
    }
    const count = (...candidates) => {
        for (const candidate of candidates) {
            if (candidate === null || candidate === undefined || candidate === "") continue;
            const raw = Array.isArray(candidate) ? candidate.length : typeof candidate === "object" ? candidate.count ?? candidate.total ?? candidate.value : candidate;
            if (raw === undefined || raw === null) continue;
            const number = Number(raw);
            if (Number.isFinite(number) && number >= 0) return number;
        }
        return null;
    };
    const resourceCount = (key) => count(data?.resources?.[key], data?.[`total_${key}`], data?.[`${key}_count`], data?.[key]);
    const statuses = data?.orders_by_status || data?.order_status_counts || data?.orders || {};
    const statusRows = [
        ["Pending", "pending", "#b87813"],
        ["Processing", "processing", "#7956b5"],
        ["Shipped", "shipped", "#337cb6"],
        ["Delivered", "delivered", "#25845a"],
        ["Cancelled", "cancelled", "#bb4350"],
    ].map(([label, key, color]) => ({
        label, color,
        count: count(statuses[key], statuses[label], data?.[`${key}_orders`], data?.[`${key}_count`]),
    }));
    const catalogRows = [
        ["Products", "products", "#d17a08"],
        ["Categories", "categories", "#337cb6"],
        ["Subcategories", "subcategories", "#397c80"],
        ["Offers", "offers", "#7956b5"],
    ].map(([label, key, color]) => ({ label, color, count: resourceCount(key) }));
    const cards = [
        ["Total products", resourceCount("products"), FiPackage, "orange"],
        ["Total users", resourceCount("users"), FiUsers, "blue"],
        ["Total orders", resourceCount("orders"), FiShoppingBag, "purple"],
        ["Total coupons", resourceCount("coupons"), FiTag, "green"],
    ];
    const lowStock = count(data?.low_stock_count, data?.low_stock, data?.products_low_stock);
    const downloadOverview = () => {
        const rows = flattenForCsv(data);
        if (!rows.length) {
            toast.info("There is no overview data to export yet.");
            return;
        }
        downloadCsv("dashboard-overview.csv", rows, [{ key: "metric", label: "Metric" }, { key: "value", label: "Value" }]);
        toast.success("Overview CSV downloaded");
    };
    return <div className="admin-page">
        <PageHeader eyebrow="OVERVIEW" title="Store overview" description="Your store at a glance — products, customers, and order progress." />
        <div className="admin-overview-export"><CsvButton onClick={downloadOverview} disabled={loading || !Object.keys(data || {}).length} /></div>
        <section className="admin-stat-grid" aria-label="Store totals" aria-busy={loading}>
            {cards.map(([label, number, Icon, tone]) => <article className="admin-stat-card" key={label}>
                <span className={`admin-stat-icon ${tone}`}><Icon aria-hidden="true" /></span>
                <div><small>{label}</small><strong>{loading ? <Skeleton className="overview-skeleton-value" /> : number === null ? "Unavailable" : number.toLocaleString()}</strong></div>
            </article>)}
        </section>
        <OverviewGraphs statusRows={statusRows} catalogRows={catalogRows} loading={loading} />
        {lowStock !== null && !loading && <p className="admin-muted">Low stock: <strong>{lowStock.toLocaleString()}</strong> items need attention.</p>}
    </div>;
}

function ResourcePage({ resource, schema }) {
    const config = resources[resource];
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const defaultOrdering = resource === "products" ? "-id" : resource === "trust-benefits" ? "display_order" : "";
    const [ordering, setOrdering] = useState(defaultOrdering);
    const [status, setStatus] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [couponProduct, setCouponProduct] = useState("");
    const [couponCategory, setCouponCategory] = useState("");
    const [couponDiscountType, setCouponDiscountType] = useState("");
    const [couponActive, setCouponActive] = useState("");
    const [modal, setModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [duplicatingId, setDuplicatingId] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [unitTypeRows, setUnitTypeRows] = useState([]);
    const [usageReferences, setUsageReferences] = useState({ coupons: [], users: [], products: [] });
    const [tableReferences, setTableReferences] = useState({});
    const params = useMemo(() => ({ page, page_size: pageSize, ...(search && { search }), ...(ordering && { ordering }), ...(resource === "orders" && status && { status }), ...(resource === "orders" && paymentStatus && { payment_status: paymentStatus }), ...(resource === "orders" && dateFrom && { date_from: dateFrom }), ...(resource === "orders" && dateTo && { date_to: dateTo }), ...(resource === "coupons" && couponProduct && { product: couponProduct }), ...(resource === "coupons" && couponCategory && { category: couponCategory }), ...(resource === "coupons" && couponDiscountType && { discount_type: couponDiscountType }), ...(resource === "coupons" && couponActive && { is_active: couponActive }) }), [page, pageSize, search, ordering, resource, status, paymentStatus, dateFrom, dateTo, couponProduct, couponCategory, couponDiscountType, couponActive]);
    const state = useAdminResource(resource, params);
    const relationshipParams = useMemo(() => ({ page_size: 500 }), []);
    const productVariantsState = useAdminResource("product-variants", relationshipParams, resource === "products");
    const productImagesState = useAdminResource("product-images", relationshipParams, resource === "products");
    const productImageMap = useMemo(() => relatedProductImageMap(productVariantsState.rows, productImagesState.rows), [productVariantsState.rows, productImagesState.rows]);

    useEffect(() => {
        if (resource !== "units") return undefined;
        let active = true;
        listResource("unit-types", { page_size: 500 }).then((response) => { if (active) setUnitTypeRows(unwrapListForReference(response.data)); }).catch(() => { if (active) setUnitTypeRows([]); });
        return () => { active = false; };
    }, [resource]);
    useEffect(() => {
        if (resource !== "coupon-usages") return undefined;
        let active = true;
        Promise.all([listResource("coupons", { page_size: 500 }), listResource("users", { page_size: 500 }), listResource("products", { page_size: 500 })]).then(([coupons, users, products]) => {
            if (!active) return;
            setUsageReferences({ coupons: unwrapListForReference(coupons.data), users: unwrapListForReference(users.data), products: unwrapListForReference(products.data) });
        }).catch(() => { if (active) setUsageReferences({ coupons: [], users: [], products: [] }); });
        return () => { active = false; };
    }, [resource]);
    useEffect(() => {
        const referenceByColumn = { user: "users", customer: "users", product: "products", variant: "product-variants", variant_unit: "product-variant-units", category: "categories", subcategory: "subcategories", offer: "offers", color: "colors", unit_type: "unit-types", unit: "units", coupon: "coupons", order: "orders", address: "addresses", cancelled_by: "users" };
        const names = [...new Set((resources[resource]?.columns || []).map((key) => referenceByColumn[key]).filter(Boolean))];
        if (!names.length) return undefined;
        let active = true;
        Promise.all(names.map((name) => listResource(name, { page_size: 500 }).then((response) => [name, unwrapListForReference(response.data)]).catch(() => [name, []]))).then((entries) => { if (active) setTableReferences(Object.fromEntries(entries)); });
        return () => { active = false; };
    }, [resource]);

    const fields = fieldsFromSchema(schema, resource);
    const columnKeys = config.columns || (fields.length ? fields.map((field) => field.name || field.key).slice(0, 6) : ["id"]);
    const genericColumns = columnKeys.map((key) => ({
        key,
        label: resource === "coupon-usages" && key === "user" ? "Used By" : columnLabel(resource, key),
        render: (row) => {
            if (resource === "products" && key === "product_image") {
                const image = productImageMap.get(String(recordId(row))) || row.product_image || row.image;
                const imagePath = typeof image === "object" ? image?.url || image?.image : image;
                return imagePath ? <img className="table-image-thumb product-table-image" src={getImageUrl(imagePath)} alt={`${row.name || "Product"} image`} /> : "—";
            }
            if (resource === "coupon-usages" && ["user", "coupon", "product"].includes(key)) return recordLabel(usageReferences[{ user: "users", coupon: "coupons", product: "products" }[key]].find((item) => String(recordId(item)) === String(row?.[key]?.id ?? row?.[key])) || row?.[key]);
            return resolveTableValue(row, key, resource === "units" ? { ...tableReferences, "unit-types": unitTypeRows } : tableReferences);
        },
    }));
    const columns = resource === "coupons" ? [
        { key: "copy", label: "Copy", render: (row) => <button type="button" className="table-copy-button" title="Copy coupon code" onClick={async () => { if (!row?.code) return; try { await navigator.clipboard.writeText(row.code); toast.success("Coupon code copied"); } catch { toast.error("Could not copy coupon code"); } }}><FiCopy /> Copy</button> },
        { key: "code", label: "Coupon Code", render: (row) => row?.code || "—" },
        { key: "applicability_type", label: "Apply To", render: (row) => couponApplyTo(row) },
        { key: "target_name", label: "Target", render: (row) => couponTarget(row, tableReferences) },
        { key: "discount_type", label: "Discount Type", render: (row) => String(row?.discount_type || (row?.fixed_amount != null ? "FIXED" : "PERCENTAGE")).toUpperCase() === "FIXED" ? "Fixed Amount" : "Percentage" },
        { key: "discount_value", label: "Discount", render: (row) => couponDiscount(row) },
        { key: "start_date", label: "Start Date", render: (row) => date(row?.start_date || row?.valid_from) },
        { key: "end_date", label: "Expiry Date", render: (row) => date(row?.end_date || row?.valid_until) },
        { key: "is_active", label: "Status", render: (row) => <StatusPill value={row?.is_active ? "Active" : "Inactive"} /> },
    ] : genericColumns;
    const clearFilters = () => { setSearch(""); setOrdering(defaultOrdering); setStatus(""); setPaymentStatus(""); setDateFrom(""); setDateTo(""); setCouponProduct(""); setCouponCategory(""); setCouponDiscountType(""); setCouponActive(""); setPage(1); };
    const openView = (row) => navigate(`/mittyco-dashboard/${resource}/${recordId(row)}/view`);
    const openEdit = (row) => navigate(`/mittyco-dashboard/${resource}/${recordId(row)}/edit`);
    const addAction = resource === "products" ? () => navigate("/mittyco-dashboard/products/new") : ["hero-banners", "promo-banners", "hero-side-banners", "coupons", "coupon-usages", "trust-benefits", "product-highlights", "product-messages"].includes(resource) ? () => navigate(`/mittyco-dashboard/${resource}/new`) : () => setModal({ mode: "create", initialValues: resource === "trust-benefits" ? { is_active: true, display_order: 1 } : {} });
    const toggleCoupon = async (row) => {
        if (togglingId) return;
        const couponId = recordId(row);
        setTogglingId(couponId);
        try {
            await updateResource("coupons", couponId, { is_active: !row?.is_active });
            toast.success(`Coupon ${row?.is_active ? "deactivated" : "activated"}`);
            state.reload();
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not update coupon status."));
        } finally { setTogglingId(null); }
    };
    const toggleActive = async (row) => { try { await updateResource(resource, recordId(row), { is_active: !row.is_active }); toast.success(`${itemLabel(resource)} ${row.is_active ? "deactivated" : "activated"}`); state.reload(); } catch (error) { toast.error(getErrorMessage(error, `Could not update ${itemLabel(resource).toLowerCase()} status`)); } };
    const remove = async () => { try { await deleteResource(resource, recordId(deleteTarget)); toast.success(`${itemLabel(resource)} deleted`); setDeleteTarget(null); state.reload(); } catch (error) { toast.error(getErrorMessage(error, "Could not delete record")); } };
    const duplicate = async (row) => {
        if (resource !== "products" || duplicatingId) return;
        const sourceId = recordId(row);
        setDuplicatingId(sourceId);
        try {
            await duplicateResource("products", sourceId);
            toast.success("Product duplicated with all images and variants");
            state.reload();
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not duplicate product."));
        } finally {
            setDuplicatingId(null);
        }
    };
    const closeAndReload = () => { setModal(null); state.reload(); };
    const downloadResourceCsv = async () => {
        setExporting(true);
        try {
            const rows = await fetchAllResourceRows(resource, params);
            if (!rows.length) {
                toast.info(`There are no ${config.label.toLowerCase()} to export.`);
                return;
            }
            downloadCsv(`${resource}.csv`, rows, exportColumns(resource, rows));
            toast.success(`${config.label} CSV downloaded`);
        } catch (error) {
            toast.error(getErrorMessage(error, `Could not export ${config.label.toLowerCase()}.`));
        } finally {
            setExporting(false);
        }
    };
    const canExport = resource === "products" || resource === "orders" || resource === "order-items";

    return <div className="admin-page"><PageHeader title={config.label} description={`Create, review, update, and remove ${config.label.toLowerCase()} records.`} action={<AdminHeaderActions>{canExport && <CsvButton onClick={downloadResourceCsv} loading={exporting} />}<button className="admin-button primary" onClick={addAction}><FiPlus /> Add {itemLabel(resource)}</button></AdminHeaderActions>} /><div className="admin-panel"><FilterBar onClear={clearFilters}><DebouncedSearch value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder={`Search ${config.label.toLowerCase()}...`} /><label className="admin-select"><span>Order</span><select value={ordering} onChange={(event) => { setOrdering(event.target.value); setPage(1); }}><option value="">Default</option>{resource === "trust-benefits" && <><option value="display_order">Display order</option><option value="-display_order">Reverse display order</option></>}<option value="-created_at">Newest</option><option value="created_at">Oldest</option><option value="code">Code A-Z</option><option value="-code">Code Z-A</option><option value="name">Name A-Z</option><option value="-name">Name Z-A</option></select><FiChevronDown /></label>{resource === "orders" && <><label className="admin-select"><span>Status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="admin-select"><span>Payment</span><select value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value); setPage(1); }}><option value="">All payments</option>{["Pending", "Paid", "Failed", "Refunded"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="admin-date"><span>From</span><input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} /></label><label className="admin-date"><span>To</span><input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} /></label></>}{resource === "coupons" && <><label className="admin-select"><span>Product</span><select value={couponProduct} onChange={(event) => { setCouponProduct(event.target.value); setPage(1); }}><option value="">All products</option>{(tableReferences.products || []).map((product) => <option key={recordId(product)} value={recordId(product)}>{recordLabel(product)}</option>)}</select></label><label className="admin-select"><span>Category</span><select value={couponCategory} onChange={(event) => { setCouponCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{(tableReferences.categories || []).map((category) => <option key={recordId(category)} value={recordId(category)}>{recordLabel(category)}</option>)}</select></label><label className="admin-select"><span>Discount</span><select value={couponDiscountType} onChange={(event) => { setCouponDiscountType(event.target.value); setPage(1); }}><option value="">All types</option><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option></select></label><label className="admin-select"><span>Status</span><select value={couponActive} onChange={(event) => { setCouponActive(event.target.value); setPage(1); }}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select></label></>}</FilterBar><DataTable columns={columns} rows={state.rows} loading={state.loading} error={state.error} onRetry={state.reload} actions={(row) => <><button className="table-icon" title="View details" aria-label={`View ${itemLabel(resource)}`} onClick={() => openView(row)}><FiEye /></button><button className="table-icon" title="Edit" aria-label={`Edit ${itemLabel(resource)}`} onClick={() => openEdit(row)}><FiEdit3 /></button>{resource === "products" && <button className="table-icon" title="Duplicate product" aria-label={`Duplicate ${row?.name || "product"}`} onClick={() => duplicate(row)} disabled={duplicatingId === recordId(row)}><FiCopy /></button>}{resource === "coupons" && <button className="table-icon" title={row?.is_active ? "Deactivate" : "Activate"} aria-label={`${row?.is_active ? "Deactivate" : "Activate"} coupon`} onClick={() => toggleCoupon(row)} disabled={togglingId === recordId(row)}><FiPower /></button>}{resource === "trust-benefits" && <button className="table-icon" title={row.is_active ? "Deactivate" : "Activate"} aria-label={`${row.is_active ? "Deactivate" : "Activate"} ${itemLabel(resource)}`} onClick={() => toggleActive(row)}>{row.is_active ? <FiToggleRight /> : <FiToggleLeft />}</button>}<button className="table-icon danger" title="Delete" aria-label={`Delete ${itemLabel(resource)}`} onClick={() => setDeleteTarget(row)}><FiTrash2 /></button></>} /><Pagination page={page} pageSize={pageSize} count={state.count} next={state.next} previous={state.previous} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} /></div>{modal && <ResourceModal resource={resource} schema={schema} mode={modal.mode} initialValues={modal.initialValues} onClose={() => setModal(null)} onSaved={closeAndReload} />}{deleteTarget && <ConfirmDialog message={`Delete this ${itemLabel(resource).toLowerCase()} permanently?`} onCancel={() => setDeleteTarget(null)} onConfirm={remove} />}</div>;
}

function ReadOnlyResourcePage({ resource, id, schema }) {
    const navigate = useNavigate();
    const config = resources[resource];
    const [row, setRow] = useState(null);
    const [references, setReferences] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const fields = useMemo(() => { const schemaFields = fieldsFromSchema(schema, resource); return schemaFields.length ? schemaFields : resourceFallbackFields(resource, config.fields); }, [schema, resource, config.fields]);
    useEffect(() => {
        let active = true;
        getResource(resource, id).then((response) => { if (active) setRow(response.data); }).catch((requestError) => { if (active) setError(getErrorMessage(requestError, "Could not load record.")); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [resource, id]);
    useEffect(() => {
        const referenceByField = { user: "users", customer: "users", product: "products", variant: "product-variants", variant_unit: "product-variant-units", category: "categories", subcategory: "subcategories", offer: "offers", color: "colors", unit_type: "unit-types", unit: "units", coupon: "coupons", order: "orders", address: "addresses", cancelled_by: "users" };
        const names = [...new Set(fields.map((field) => referenceByField[field.name || field.key]).filter(Boolean))];
        if (!names.length) return undefined;
        let active = true;
        Promise.all(names.map((name) => listResource(name, { page_size: 500 }).then((response) => [name, unwrapListForReference(response.data)]).catch(() => [name, []]))).then((entries) => { if (active) setReferences(Object.fromEntries(entries)); });
        return () => { active = false; };
    }, [fields]);
    if (loading) return <div className="admin-page"><LoadingState label="Loading record details..." /></div>;
    if (error || !row) return <div className="admin-page"><button className="admin-back-link" onClick={() => navigate(`/mittyco-dashboard/${resource}`)}>Back to {config.label}</button><div className="admin-form-error">{error || "Record not found."}</div></div>;
    return <div className="admin-page"><button className="admin-back-link" onClick={() => navigate(`/mittyco-dashboard/${resource}`)}>Back to {config.label}</button><PageHeader eyebrow="VIEW RECORD" title={`${itemLabel(resource)} details`} description="Read-only record details." /><section className="admin-panel resource-view-panel"><div className="resource-view-grid">{fields.map((field) => { const name = field.name || field.key; return <div className="resource-view-field" key={name}><small>{field.label || titleize(name)}</small><div>{resolveTableValue(row, name, references)}</div></div>; })}</div></section></div>;
}

function ResourceEditorPage({ resource, id, schema }) {
    const config = resources[resource];
    const navigate = useNavigate();
    const editing = Boolean(id);
    const [values, setValues] = useState(() => resource === "trust-benefits" ? { display_order: 1, is_active: true } : resource === "product-highlights" ? { highlight_type: "message", icon_key: "tag", background_color: "#1B4D44", text_color: "#FFFFFF", display_order: 0, rotation_seconds: 4, is_active: true } : resource === "product-messages" ? { message_type: "text", background_color: "#EAF4FF", text_color: "#173B35", display_order: 0, rotation_seconds: 4, is_active: true } : {});
    const [references, setReferences] = useState({});
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [requestError, setRequestError] = useState(null);
    const fallback = useMemo(() => { const schemaFields = fieldsFromSchema(schema, resource); return schemaFields.length ? schemaFields : resourceFallbackFields(resource, config.fields); }, [schema, resource, config.fields]);
    const errors = useFormErrors(requestError);
    useEffect(() => {
        let active = true;
        if (!editing) return () => { active = false; };
        getResource(resource, id).then((response) => { if (active) setValues(response.data || {}); }).catch((error) => { if (active) setRequestError(error); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [editing, id, resource, fallback]);
    useEffect(() => {
        const referenceByField = { user: "users", customer: "users", product: "products", variant: "product-variants", variant_unit: "product-variant-units", category: "categories", subcategory: "subcategories", offer: "offers", color: "colors", unit_type: "unit-types", unit: "units", coupon: "coupons", order: "orders", address: "addresses", cancelled_by: "users" };
        const names = [...new Set(fallback.map((field) => referenceByField[field.name || field.key]).filter(Boolean))];
        if (!names.length) return undefined;
        let active = true;
        Promise.all(names.map((name) => listResource(name, { page_size: 500 }).then((response) => [name, unwrapReferenceRows(response.data)]).catch(() => [name, []]))).then((entries) => { if (active) setReferences(Object.fromEntries(entries)); });
        return () => { active = false; };
    }, [fallback]);
    const setValue = (name, value) => setValues((current) => ({ ...current, [name]: value }));
    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setRequestError(null);
        try {
            await validateUniqueUnit(resource, values, editing ? values : null);
            const payload = cleanPayload(values, resource);
            if (editing) await updateResource(resource, id, payload, payload instanceof FormData);
            else await createResource(resource, payload, payload instanceof FormData);
            toast.success(`${itemLabel(resource)} ${editing ? "updated" : "created"}`);
            navigate(`/mittyco-dashboard/${resource}`);
        } catch (error) {
            setRequestError(error);
            toast.error(getErrorMessage(error, "Please correct the form errors"));
        } finally { setSaving(false); }
    };
    if (loading) return <div className="admin-page"><LoadingState label="Loading record editor..." /></div>;
    return <div className="admin-page resource-editor-page"><button className="admin-back-link" onClick={() => navigate(`/mittyco-dashboard/${resource}`)}>Back to {config.label}</button><PageHeader eyebrow={editing ? "EDIT RECORD" : "NEW RECORD"} title={`${editing ? "Edit" : "Add"} ${itemLabel(resource)}`} description="Update the record and save your changes." /><section className="admin-panel resource-editor-panel"><form className="admin-form" onSubmit={save}><div className="admin-form-grid">{fallback.map((field) => { const name = field.name || field.key; const refName = { user: "users", customer: "users", product: "products", variant: "product-variants", variant_unit: "product-variant-units", category: "categories", subcategory: "subcategories", offer: "offers", color: "colors", unit_type: "unit-types", unit: "units", coupon: "coupons", order: "orders", address: "addresses" }[name] || ""; return <FormField key={name} field={field} options={references[refName] || []} value={values[name]} onChange={setValue} error={errors[name]} readOnly={false} />; })}</div>{requestError && !Object.keys(errors).length && <p className="admin-form-error">{getErrorMessage(requestError)}</p>}<div className="admin-modal-actions"><button type="button" className="admin-button secondary" onClick={() => navigate(`/mittyco-dashboard/${resource}`)}>Cancel</button><button type="submit" className="admin-button primary" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div></form></section></div>;
}

function OrderEditPage({ id }) {
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [status, setStatus] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => { let active = true; getOrderDetails(id).then((response) => { if (!active) return; setOrder(response.data); setStatus(response.data.status || ""); setPaymentStatus(response.data.payment_status || ""); }).catch((requestError) => { if (active) setError(getErrorMessage(requestError, "Could not load order.")); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id]);
    const save = async (event) => { event.preventDefault(); setSaving(true); setError(""); try { await updateOrderDetails(id, { status, payment_status: paymentStatus }); toast.success("Order updated"); navigate(`/mittyco-dashboard/orders/${id}`); } catch (requestError) { setError(getErrorMessage(requestError, "Could not update order.")); } finally { setSaving(false); } };
    if (loading) return <div className="admin-page"><LoadingState label="Loading order editor..." /></div>;
    if (!order) return <div className="admin-page"><button className="admin-back-link" onClick={() => navigate("/mittyco-dashboard/orders")}>Back to orders</button><div className="admin-form-error">{error || "Order not found."}</div></div>;
    return <div className="admin-page resource-editor-page"><button className="admin-back-link" onClick={() => navigate(`/mittyco-dashboard/orders/${id}`)}>Back to order</button><PageHeader eyebrow="EDIT ORDER" title={order.order_number || order.order_id || `Order #${id}`} description="Update order and payment status." /><section className="admin-panel resource-editor-panel"><form className="admin-form" onSubmit={save}><div className="admin-form-grid"><label className="admin-form-field"><span>Order status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((option) => <option key={option}>{option}</option>)}</select></label><label className="admin-form-field"><span>Payment status</span><select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>{["Pending", "Paid", "Failed", "Refunded"].map((option) => <option key={option}>{option}</option>)}</select></label></div>{error && <p className="admin-form-error">{error}</p>}<div className="admin-modal-actions"><button type="button" className="admin-button secondary" onClick={() => navigate(`/mittyco-dashboard/orders/${id}`)}>Cancel</button><button type="submit" className="admin-button primary" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div></form></section></div>;
}

/* function LegacyResourcePage({ resource, schema }) {
    const config = resources[resource];
    const navigate = useNavigate();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const addAction = () => {};
    const beginEdit = () => {};
    const remove = async () => {};
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const defaultOrdering = resource === "products" ? "-id" : "";
    const [ordering, setOrdering] = useState(defaultOrdering);
    const [status, setStatus] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [modal, setModal] = useState(null);
    const [unitTypeRows, setUnitTypeRows] = useState([]);
    const [usageReferences, setUsageReferences] = useState({ coupons: [], users: [], products: [] });
    const [tableReferences, setTableReferences] = useState({});
    const params = useMemo(() => ({ page, page_size: pageSize, ...(search && { search }), ...(ordering && { ordering }), ...(resource === "orders" && status && { status }), ...(resource === "orders" && paymentStatus && { payment_status: paymentStatus }), ...(resource === "orders" && dateFrom && { date_from: dateFrom }), ...(resource === "orders" && dateTo && { date_to: dateTo }) }), [page, pageSize, search, ordering, resource, status, paymentStatus, dateFrom, dateTo]);
    const state = useAdminResource(resource, params);
    useEffect(() => {
        if (resource !== "units") return undefined;
        let active = true;
        listResource("unit-types", { page_size: 500 }).then((response) => { if (active) setUnitTypeRows(unwrapListForReference(response.data)); }).catch(() => { if (active) setUnitTypeRows([]); });
        return () => { active = false; };
    }, [resource]);
    useEffect(() => {
        if (resource !== "coupon-usages") return undefined;
        let active = true;
        Promise.all([listResource("coupons", { page_size: 500 }), listResource("users", { page_size: 500 }), listResource("products", { page_size: 500 })]).then(([coupons, users, products]) => {
            if (!active) return;
            setUsageReferences({ coupons: unwrapListForReference(coupons.data), users: unwrapListForReference(users.data), products: unwrapListForReference(products.data) });
        }).catch(() => { if (active) setUsageReferences({ coupons: [], users: [], products: [] }); });
        return () => { active = false; };
    }, [resource]);
    useEffect(() => {
        const referenceByColumn = { user: "users", customer: "users", product: "products", variant: "product-variants", variant_unit: "product-variant-units", category: "categories", subcategory: "subcategories", offer: "offers", color: "colors", unit_type: "unit-types", unit: "units", coupon: "coupons", order: "orders", address: "addresses", cancelled_by: "users" };
        const names = [...new Set((resources[resource]?.columns || []).map((key) => referenceByColumn[key]).filter(Boolean))];
        if (!names.length) return undefined;
        let active = true;
        Promise.all(names.map((name) => listResource(name, { page_size: 500 }).then((response) => [name, unwrapListForReference(response.data)]).catch(() => [name, []]))).then((entries) => { if (active) setTableReferences(Object.fromEntries(entries)); });
        return () => { active = false; };
    }, [resource]);
    const reload = () => state.reload();
    const fields = fieldsFromSchema(schema, resource);
    const columnKeys = config.columns || (fields.length ? fields.map((field) => field.name || field.key).slice(0, 6) : ["id"]);
    const columns = columnKeys.map((key) => ({ key, label: resource === "coupon-usages" && key === "user" ? "Used By" : titleize(key), render: (row) => resource === "coupon-usages" && ["user", "coupon", "product"].includes(key) ? recordLabel(usageReferences[{ user: "users", coupon: "coupons", product: "products" }[key]].find((item) => String(recordId(item)) === String(row?.[key]?.id ?? row?.[key])) || row?.[key]) : resolveTableValue(row, key, resource === "units" ? { ...tableReferences, "unit-types": unitTypeRows } : tableReferences) }));
    const clearFilters = () => { setSearch(""); setOrdering(defaultOrdering); setStatus(""); setPaymentStatus(""); setDateFrom(""); setDateTo(""); setPage(1); };
    const openView = (row) => resource === "products" ? navigate(`/mittyco-dashboard/products/${recordId(row)}`) : resource === "orders" ? navigate(`/mittyco-dashboard/orders/${recordId(row)}`) : setModal({ mode: "view", row });
    const modalContent = modal && <ResourceModal resource={resource} schema={schema} mode="view" row={modal.row} onClose={() => setModal(null)} />;
    return <div className="admin-page"><PageHeader title={config.label} description={`Create, review, update, and remove ${config.label.toLowerCase()} records.`} action={<button className="admin-button primary" onClick={addAction}><FiPlus /> Add {config.label.slice(0, -1)}</button>} /><div className="admin-panel"><FilterBar onClear={clearFilters}><DebouncedSearch value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder={`Search ${config.label.toLowerCase()}…`} /><label className="admin-select"><span>Order</span><select value={ordering} onChange={(event) => { setOrdering(event.target.value); setPage(1); }}><option value="">Default</option><option value="-created_at">Newest</option><option value="created_at">Oldest</option><option value="name">Name A–Z</option><option value="-name">Name Z–A</option></select><FiChevronDown /></label>{resource === "orders" && <><label className="admin-select"><span>Status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="admin-select"><span>Payment</span><select value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value); setPage(1); }}><option value="">All payments</option>{["Pending", "Paid", "Failed", "Refunded"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="admin-date"><span>From</span><input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} /></label><label className="admin-date"><span>To</span><input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} /></label></> }</FilterBar><DataTable columns={columns} rows={state.rows} loading={state.loading} error={state.error} onRetry={state.reload} actions={(row) => (<><button className="table-icon" title="View" onClick={() => openView(row)}><FiEye /></button><button className="table-icon" title="Edit" onClick={() => beginEdit(row)}><FiEdit3 /></button><button className="table-icon danger" title="Delete" onClick={() => setDeleteTarget(row)}><FiTrash2 /></button></>)} /><Pagination page={page} pageSize={pageSize} count={state.count} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} /></div>{modalContent}{deleteTarget && <ConfirmDialog message={`Delete this ${config.label.slice(0, -1).toLowerCase()} permanently?`} onCancel={() => setDeleteTarget(null)} onConfirm={remove} />}{editTarget && <ConfirmDialog title="Confirm order edit" message="Open this order for editing? Changes will be saved to the backend." onCancel={() => setEditTarget(null)} onConfirm={() => { setModal({ mode: "edit", row: editTarget }); setEditTarget(null); }} />}</div>;
}
*/

function ResourceModal({ resource, schema, mode, row, initialValues = {}, onClose, onSaved }) {
    const config = resources[resource];
    const [values, setValues] = useState(() => normalizeResourceValues({ ...(resource === "product-highlights" ? { highlight_type: "message", icon_key: "tag", background_color: "#1B4D44", text_color: "#FFFFFF", display_order: 0, rotation_seconds: 4, is_active: true } : resource === "product-messages" ? { message_type: "text", background_color: "#EAF4FF", text_color: "#173B35", display_order: 0, rotation_seconds: 4, is_active: true } : {}), ...(row || {}), ...initialValues }, resource));
    const [saving, setSaving] = useState(false);
    const [requestError, setRequestError] = useState(null);
    const [references, setReferences] = useState({});
    const [productMode, setProductMode] = useState(row?.product_type || (row?.has_variants ? "multiple" : "single"));
    const fallback = useMemo(() => { const fields = fieldsFromSchema(schema, resource); return fields.length ? fields.map((field) => { const name = field.name || field.key; if (resource === "offers" && ["discount", "discount_percentage"].includes(name)) return { ...field, type: "number", label: "Discount (%)", min: 0, max: 100, step: 0.01 }; if (resource === "offers" && ["start_date", "end_date"].includes(name)) return { ...field, type: "date" }; return field; }) : resourceFallbackFields(resource, config.fields); }, [schema, resource, config.fields]);
    const errors = useFormErrors(requestError);
    const readOnly = mode === "view";
    useEffect(() => {
        if (mode === "view" && recordId(row)) getResource(resource, recordId(row)).then((response) => setValues((current) => ({ ...current, ...response.data }))).catch(() => {});
    }, [mode, resource, row]);
    useEffect(() => {
        const referenceNames = [...new Set(fallback.flatMap((field) => {
            const name = field.name || field.key || "";
            if (name.includes("category")) return ["categories", "subcategories"];
            if (name.includes("offer")) return ["offers"];
            if (name.includes("product")) return ["products"];
            if (name.includes("variant")) return ["product-variants"];
            if (name.includes("color")) return ["colors"];
            if (name.includes("unit_type")) return ["unit-types"];
            if (name === "unit") return ["units"];
            if (name.includes("region")) return ["regions"];
            if (["user", "customer"].includes(name)) return ["users"];
            if (name.includes("coupon")) return ["coupons"];
            if (name.includes("order")) return ["orders"];
            return [];
        }))];
        if (!referenceNames.length) return;
        Promise.all(referenceNames.map((name) => listResource(name, { page_size: 100 })).map((request, index) => request.then((response) => [referenceNames[index], unwrapReferenceRows(response.data)]).catch(() => [referenceNames[index], []]))).then((entries) => setReferences(Object.fromEntries(entries)));
    }, [fallback, resource]);
    const setValue = (name, value) => setValues((current) => ({ ...current, [name]: value }));
    const submit = async (event) => {
        event.preventDefault();
        if (readOnly) return onClose();
        const passwordError = resource === "users" && (mode === "create" || String(values.password || "").length)
            ? getPasswordPolicyError(values.password || "")
            : "";
        if (passwordError) {
            const validationError = { response: { data: { password: [passwordError] } } };
            setRequestError(validationError);
            toast.error(passwordError);
            return;
        }
        setSaving(true);
        setRequestError(null);
        try {
            await validateUniqueUnit(resource, values, row);
            const productTypeFields = fallback.map((field) => field.name || field.key);
            const productValues = resource === "products"
                ? { ...values, ...(productTypeFields.includes("product_type") ? { product_type: productMode } : {}), ...(productTypeFields.includes("has_variants") ? { has_variants: productMode === "multiple" } : {}) }
                : values;
            const payload = cleanPayload(productValues, resource);
            if (mode === "edit") await updateResource(resource, recordId(row), payload, payload instanceof FormData);
            else await createResource(resource, payload, payload instanceof FormData);
            toast.success(`${itemLabel(resource)} ${mode === "edit" ? "updated" : "created"}`);
            onSaved();
        } catch (error) {
            setRequestError(error);
            toast.error(getErrorMessage(error, "Please correct the form errors"));
        } finally {
            setSaving(false);
        }
    };
    return <Modal wide={fallback.length > 8} onClose={onClose} title={`${readOnly ? "View" : mode === "edit" ? "Edit" : "Create"} ${itemLabel(resource)}`}><div className="admin-form"><form onSubmit={submit}>{resource === "products" && <fieldset className="product-type-field"><legend>Product Type</legend><label><input type="radio" name="product_mode" checked={productMode === "single"} onChange={() => setProductMode("single")} /> Single Product</label><label><input type="radio" name="product_mode" checked={productMode === "multiple"} onChange={() => setProductMode("multiple")} /> Multiple Product</label><small>Use the dedicated product editor to manage variants and images.</small></fieldset>}<div className="admin-form-grid">{fallback.map((field) => { const name = field.name || field.key; const refName = name.includes("category") ? (name.includes("sub") ? "subcategories" : "categories") : name.includes("offer") ? "offers" : name.includes("product") ? "products" : name.includes("variant") ? "product-variants" : name.includes("color") ? "colors" : name.includes("unit_type") ? "unit-types" : name === "unit" ? "units" : ["user", "customer"].includes(name) ? "users" : name.includes("coupon") ? "coupons" : name.includes("order") ? "orders" : ""; return <FormField key={name} field={field} options={references[refName] || []} value={values[name]} onChange={setValue} error={errors[name]} />; })}</div>{requestError && !Object.keys(errors).length && <p className="admin-form-error">{getErrorMessage(requestError)}</p>}<div className="admin-modal-actions"><button type="button" className="admin-button secondary" onClick={onClose}>{readOnly ? "Close" : "Cancel"}</button>{!readOnly && <button className="admin-button primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>}</div></form></div></Modal>;
}

async function validateUniqueUnit(resource, values, row) {
    if (!['unit-types', 'units'].includes(resource)) return;
    const name = String(values.name || '').trim().toLowerCase();
    if (!name) return;
    const response = await listResource(resource, { page_size: 500 });
    const existing = unwrapListForReference(response.data);
    const currentId = String(recordId(row) || '');
    const duplicate = existing.some((item) => {
        if (String(recordId(item) || '') === currentId) return false;
        if (String(item.name || '').trim().toLowerCase() !== name) return false;
        if (resource === 'units' && String(recordId(item.unit_type) || item.unit_type || '') !== String(recordId(values.unit_type) || values.unit_type || '')) return false;
        return true;
    });
    if (duplicate) {
        const message = resource === 'units' ? 'A Unit with this name already exists for the selected Unit Type.' : 'A Unit Type with this name already exists.';
        throw { response: { data: { name: [message] } } };
    }
}

function unwrapReferenceRows(payload) {
    const result = unwrapListForReference(payload);
    return result.map((row) => ({ value: row.id ?? row.pk, label: row.name || row.title || row.email || row.code || `#${row.id ?? row.pk}` }));
}

function unwrapListForReference(payload) {
    if (Array.isArray(payload)) return payload;
    return Array.isArray(payload?.results) ? payload.results : [];
}

function normalizeResourceValues(values, resource) {
    if (["product-highlights", "product-messages"].includes(resource)) {
        return Object.fromEntries(Object.entries(values).map(([key, value]) => [
            key,
            key === "ends_at" && typeof value === "string" && value
                ? (() => {
                    const parsed = new Date(value);
                    if (Number.isNaN(parsed.getTime())) return value;
                    const pad = (number) => String(number).padStart(2, "0");
                    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
                })()
                : value,
        ]));
    }
    if (resource !== "offers") return values;
    return Object.fromEntries(Object.entries(values).map(([key, value]) => [
        key,
        ["start_date", "end_date"].includes(key) && typeof value === "string"
            ? value.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || value
            : value,
    ]));
}

function cleanPayload(values, resource) {
    const isFileField = (key) => key === "image" || key.includes("_image") || key.includes("logo");
    const entries = Object.entries(normalizeResourceValues(values, resource)).filter(([key, value]) => !["id", "pk", "created_at", "updated_at"].includes(key) && value !== undefined && value !== null && value !== "" && !(isFileField(key) && !(value instanceof File)));
    const hasFile = entries.some(([, value]) => value instanceof File);
    if (!hasFile) return resource === "products" ? { ...Object.fromEntries(entries), emi_available: false, emi_starting_price: null } : Object.fromEntries(entries);
    const form = new FormData(); entries.forEach(([key, value]) => { if (Array.isArray(value)) value.forEach((item) => form.append(key, item)); else form.append(key, value); });
    if (resource === "products") { form.set("emi_available", "false"); form.set("emi_starting_price", "null"); }
    return form;
}

// Kept for the legacy product-tool modal flow; the current product editor owns this UI.
// eslint-disable-next-line no-unused-vars
function ProductTools({ productId }) {
    const schema = {};
    const variants = useAdminResource("product-variants", { page_size: 100 });
    const images = useAdminResource("product-images", { page_size: 100 });
    const [modal, setModal] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const belongsToProduct = (row) => String(row.product?.id ?? row.product_id ?? row.product) === String(productId);
    const productVariants = variants.rows.filter(belongsToProduct);
    const productImages = images.rows.filter(belongsToProduct);
    const remove = async () => { try { await deleteResource(deleting.resource, recordId(deleting.row)); toast.success("Record deleted"); setDeleting(null); variants.reload(); images.reload(); } catch (error) { toast.error(getErrorMessage(error, "Could not delete record")); } };
    return <div className="product-tools"><div className="product-tools-heading"><h3>Product management</h3><span>Manage variants, single/multiple prices, sizes, units, and images.</span></div><div className="product-tool-section"><div className="product-tool-title"><strong>Variants</strong><button type="button" className="admin-button secondary" onClick={() => setModal({ type: "variant", mode: "create", initialValues: { product: productId } })}><FiPlus /> Add variant</button></div>{variants.loading ? <LoadingState label="Loading variants…" /> : productVariants.length ? <div className="nested-table">{productVariants.map((variant) => <div className="nested-row-wrap" key={recordId(variant)}><div className="nested-row"><span><strong>{recordLabel(variant.color) || "Variant"}</strong><small>{variant.price_type === "multiple" ? "Multiple Price" : `Single Price · ${variant.price ? money(variant.price) : "Price not set"} · Stock ${variant.stock ?? 0}`}</small></span><span><button type="button" className="table-icon" onClick={() => setModal({ type: "variant", mode: "edit", row: variant })}><FiEdit3 /></button><button type="button" className="table-icon danger" onClick={() => setDeleting({ resource: "product-variants", row: variant })}><FiTrash2 /></button></span></div></div>)}</div> : <p className="admin-muted product-empty">No variants linked to this product.</p>}</div><div className="product-tool-section"><div className="product-tool-title"><strong>Product images</strong><button type="button" className="admin-button secondary" onClick={() => setModal({ type: "image", resource: "product-images", mode: "create", initialValues: { product: productId } })}><FiPlus /> Upload image</button></div>{images.loading ? <LoadingState label="Loading images…" /> : productImages.length ? <div className="image-thumb-grid">{productImages.map((image) => <div className="image-thumb" key={recordId(image)}><img src={image.image || image.url} alt={image.alt_text || "Product"} /><button type="button" onClick={() => setDeleting({ resource: "product-images", row: image })}><FiTrash2 /></button></div>)}</div> : <p className="admin-muted product-empty">No images uploaded for this product.</p>}</div>{modal?.type === "variant" && <VariantEditorModal productId={productId} schema={schema} mode={modal.mode} row={modal.row} onClose={() => setModal(null)} onSaved={() => { setModal(null); variants.reload(); }} />}{modal?.type === "image" && <ResourceModal resource={modal.resource} schema={schema} mode={modal.mode} row={modal.row} initialValues={modal.initialValues} onClose={() => setModal(null)} onSaved={() => { setModal(null); images.reload(); }} />}{deleting && <ConfirmDialog message="Delete this product record permanently?" onCancel={() => setDeleting(null)} onConfirm={remove} />}</div>;
}

function VariantEditorModal({ productId, mode, row, onClose, onSaved }) {
    const [values, setValues] = useState(() => ({ product: productId || row?.product?.id || row?.product || "", color: row?.color?.id ?? row?.color ?? "", price_type: row?.price_type || "single", price: row?.price ?? "", stock: row?.stock ?? 0 }));
    const [units, setUnits] = useState([]);
    const [deletedUnitIds, setDeletedUnitIds] = useState([]);
    const [options, setOptions] = useState({ products: [], colors: [], unitTypes: [], units: [] });
    const [loading, setLoading] = useState(mode === "edit");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const variantId = recordId(row);

    useEffect(() => {
        Promise.all([listResource("products", { page_size: 100 }), listResource("colors", { page_size: 100 }), listResource("unit-types", { page_size: 100 }), listResource("units", { page_size: 100 })]).then(([products, colors, unitTypes, unitRows]) => setOptions({ products: rowsForOptions(products.data), colors: rowsForOptions(colors.data), unitTypes: rowsForOptions(unitTypes.data), units: rowsForOptions(unitRows.data) })).catch(() => setError("Could not load variant dropdown options."));
        if (variantId) listResource("product-variant-units", { variant: variantId, page_size: 100 }).then((response) => setUnits(rowsFromPayload(response.data).map((unit) => ({ ...unit, unit_type: unit.unit_type?.id ?? unit.unit_type ?? "", unit: unit.unit?.id ?? unit.unit ?? "" })))).catch((requestError) => setError(getErrorMessage(requestError, "Could not load variant units."))).finally(() => setLoading(false));
    }, [variantId]);

    const changeType = (nextType) => { if (nextType === values.price_type) return; if (mode === "edit" && !window.confirm(`Switch this variant to ${nextType === "single" ? "Single Price" : "Multiple Price"}?`)) return; if (nextType === "single" && units.length && !window.confirm("Switching to Single Price will clear all existing size/unit rows. Continue?")) return; if (nextType === "single") { setDeletedUnitIds((current) => [...current, ...units.map((unit) => recordId(unit)).filter(Boolean)]); setUnits([]); } setValues((current) => ({ ...current, price_type: nextType, ...(nextType === "multiple" ? { price: "", stock: 0 } : {}) })); };
    const updateUnit = (index, key, value) => setUnits((current) => current.map((unit, unitIndex) => unitIndex === index ? { ...unit, [key]: value } : unit));
    const addUnit = () => setUnits((current) => [...current, { unit_type: "", unit: "", price: "", stock: "" }]);
    const removeUnit = (index) => { const unit = units[index]; if (recordId(unit)) setDeletedUnitIds((current) => [...current, recordId(unit)]); setUnits((current) => current.filter((_, unitIndex) => unitIndex !== index)); };
    const validate = () => { if (!values.product) return "Product is required."; if (values.price_type === "single") { if (values.price === "" || Number(values.price) < 0) return "Single Price requires a non-negative price."; if (values.stock === "" || Number(values.stock) < 0) return "Single Price requires a non-negative stock value."; } else { if (!units.length) return "Multiple Price requires at least one size/unit row."; for (const unit of units) if (!unit.unit_type || !unit.unit || unit.price === "" || unit.stock === "" || Number(unit.price) < 0 || Number(unit.stock) < 0) return "Every size/unit row requires unit type, unit, price, and non-negative stock."; } return ""; };
    const save = async (event) => { event.preventDefault(); const validation = validate(); if (validation) return setError(validation); setSaving(true); setError(""); try { const payload = { product: values.product, color: values.color || null, price_type: values.price_type, price: values.price_type === "single" ? Number(values.price) : null, stock: values.price_type === "single" ? Number(values.stock) : 0 }; const response = mode === "edit" ? await updateResource("product-variants", variantId, payload) : await createResource("product-variants", payload); const savedVariantId = variantId || recordId(response.data); if (values.price_type === "single") { for (const unitId of deletedUnitIds) await deleteResource("product-variant-units", unitId); } else { for (const unitId of deletedUnitIds) await deleteResource("product-variant-units", unitId); for (const unit of units) { const unitPayload = { variant: savedVariantId, unit_type: unit.unit_type, unit: unit.unit, price: Number(unit.price), stock: Number(unit.stock) }; if (recordId(unit)) await updateResource("product-variant-units", recordId(unit), unitPayload); else await createResource("product-variant-units", unitPayload); } } toast.success(`Variant ${mode === "edit" ? "updated" : "created"}`); onSaved(); } catch (requestError) { setError(getErrorMessage(requestError, "Could not save variant.")); toast.error(getErrorMessage(requestError, "Could not save variant.")); } finally { setSaving(false); } };
    const optionList = (name) => options[name] || [];
    return <Modal wide onClose={onClose} title={`${mode === "edit" ? "Edit" : "Create"} Product Variant`}><form className="admin-form variant-editor" onSubmit={save}>{loading ? <LoadingState label="Loading variant units…" /> : <><div className="admin-form-grid"><label className="admin-form-field"><span>Product</span><select value={values.product} disabled={Boolean(productId)} onChange={(event) => setValues((current) => ({ ...current, product: event.target.value }))}><option value="">Select product</option>{optionList("products").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="admin-form-field"><span>Color</span><select value={values.color} onChange={(event) => setValues((current) => ({ ...current, color: event.target.value }))}><option value="">Select color</option>{optionList("colors").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div><fieldset className="price-type-field"><legend>Price Type</legend><label><input type="radio" name="price_type" checked={values.price_type === "single"} onChange={() => changeType("single")} /> Single Price</label><label><input type="radio" name="price_type" checked={values.price_type === "multiple"} onChange={() => changeType("multiple")} /> Multiple Price</label></fieldset>{values.price_type === "single" ? <div className="admin-form-grid"><label className="admin-form-field"><span>Price</span><input type="number" min="0" step="0.01" value={values.price} onChange={(event) => setValues((current) => ({ ...current, price: event.target.value }))} /></label><label className="admin-form-field"><span>Stock</span><input type="number" min="0" step="1" value={values.stock} onChange={(event) => setValues((current) => ({ ...current, stock: event.target.value }))} /></label></div> : <div className="unit-editor"><div className="product-tool-title"><strong>Sizes / Units</strong><button type="button" className="admin-button secondary" onClick={addUnit}><FiPlus /> Add size/unit</button></div>{units.map((unit, index) => <div className="unit-editor-row" key={recordId(unit) || index}><select value={unit.unit_type} onChange={(event) => updateUnit(index, "unit_type", event.target.value)}><option value="">Unit type</option>{optionList("unitTypes").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><select value={unit.unit} onChange={(event) => updateUnit(index, "unit", event.target.value)}><option value="">Unit</option>{optionList("units").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><input type="number" min="0" step="0.01" placeholder="Price" value={unit.price} onChange={(event) => updateUnit(index, "price", event.target.value)} /><input type="number" min="0" step="1" placeholder="Stock" value={unit.stock} onChange={(event) => updateUnit(index, "stock", event.target.value)} /><button type="button" className="table-icon danger" onClick={() => removeUnit(index)}><FiTrash2 /></button></div>)}</div>}{error && <p className="admin-form-error">{error}</p>}<div className="admin-modal-actions"><button type="button" className="admin-button secondary" onClick={onClose}>Cancel</button><button className="admin-button primary" disabled={saving}>{saving ? "Saving…" : "Save variant"}</button></div></>}</form></Modal>;
}

function rowsFromPayload(payload) { return Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : []; }
function rowsForOptions(payload) { return rowsFromPayload(payload).map((row) => ({ value: row.id ?? row.pk, label: row.name || row.title || row.email || row.code || `#${row.id ?? row.pk}` })); }

function OrderDetail({ id }) {
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let active = true;
        getOrderDetails(id).then((response) => { if (active) setOrder(response.data); }).catch(() => { if (active) setOrder(null); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id]);
    if (loading) return <div className="admin-page"><LoadingState label="Loading order details..." /></div>;
    if (!order) return <div className="admin-page"><button className="admin-back-link" onClick={() => navigate("/mittyco-dashboard/orders")}>Back to orders</button><EmptyState title="Order not found" /></div>;
    return <OrderDetailContent order={order} id={id} navigate={navigate} />;
}

function OrderDetailContent({ order, id, navigate }) {
    const items = order.items || order.order_items || [];
    const shippingLines = [order.address_name, order.address_line, order.city, order.postcode, order.country].filter(Boolean);
    const lineTotal = (item) => item.total_price ?? Number(item.price || 0) * Number(item.quantity || 0);
    return <div className="admin-page">
        <button className="admin-back-link" onClick={() => navigate("/mittyco-dashboard/orders")}>Back to orders</button>
        <PageHeader eyebrow="ORDER DETAILS" title={order.order_number || order.order_id || `Order #${id}`} description={`Created ${date(order.created_at || order.date)}. Read-only order details.`} />
        <div className="admin-detail-grid">
            <DetailCard title="Customer" icon={<FiUsers />}><strong>{order.customer_name || "Guest customer"}</strong><span>{order.customer_email || "No email provided"}</span></DetailCard>
            <DetailCard title="Shipping address" icon={<FiTruck />}>{shippingLines.length ? shippingLines.map((line, index) => <span key={`${line}-${index}`}>{line}</span>) : <span>No shipping address provided</span>}</DetailCard>
            <DetailCard title="Status & payment" icon={<FiCreditCard />}><span>Order <StatusPill value={order.status} /></span><span>Payment <StatusPill value={order.payment_status} /></span><span>Method <strong>{order.payment_method || "Not recorded"}</strong></span></DetailCard>
        </div>
        <div className="admin-panel order-items-panel">
            <div className="admin-panel-heading"><div><h3>Order items</h3><p>Product, quantity, pricing, and stock unit details</p></div><FiBox /></div>
            {items.length ? <div className="order-item-list">{items.map((item, index) => <div className="order-item" key={item.id || index}>
                <div className="order-item-image">{item.product_image || item.image ? <img src={getImageUrl(item.product_image || item.image)} alt={item.product_name || "Product"} /> : <FiBox />}</div>
                <div><strong>{item.product_name || item.name || recordLabel(item.product) || "Product"}</strong><span>Qty {item.quantity ?? 0}{item.color ? ` · ${item.color}` : ""}{item.size ? ` · ${item.size}` : ""}{item.unit_type ? ` · ${item.unit_type}` : ""}</span><small>Unit price {money(item.price)}{item.original_price !== undefined && <> · Original {money(item.original_price)}</>}{item.discount_amount !== undefined && <> · Discount {money(item.discount_amount)}</>}</small></div>
                <strong>{money(lineTotal(item))}</strong>
            </div>)}</div> : <EmptyState title="No order items" />}
            <div className="order-total"><span>Subtotal <strong>{money(order.subtotal)}</strong></span><span>Discount <strong><DirhamAmount value={-Number(order.discount_amount || 0)} useGrouping /></strong></span><span>Shipping <strong>{Number(order.shipping_charge || 0) === 0 ? "Free" : money(order.shipping_charge)}</strong></span><span className="total"><b>Total</b><strong>{money(order.total_amount)}</strong></span></div>
        </div>
    </div>;
}

/* function LegacyOrderDetail({ id }) {
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [edit, setEdit] = useState(false);
    const [confirmEdit, setConfirmEdit] = useState(false);
    useEffect(() => { getResource("orders", id).then((response) => { setOrder(response.data); setStatus(response.data.status || ""); setPaymentStatus(response.data.payment_status || ""); }).catch(() => toast.error("Could not load order details")).finally(() => setLoading(false)); }, [id]);
    if (loading) return <div className="admin-page"><LoadingState label="Loading order details…" /></div>;
    if (!order) return <div className="admin-page"><EmptyState title="Order not found" /></div>;
    const items = order.items || order.order_items || [];
    const save = async () => { setSaving(true); try { await updateResource("orders", id, { status, payment_status: paymentStatus }); toast.success("Order updated"); setEdit(false); const response = await getResource("orders", id); setOrder(response.data); } catch (error) { toast.error(getErrorMessage(error, "Could not update order")); } finally { setSaving(false); } };
    return <div className="admin-page"><button className="admin-back-link" onClick={() => navigate("/mittyco-dashboard/orders")}>← Back to orders</button><PageHeader eyebrow="ORDER DETAILS" title={order.order_number || order.order_id || `Order #${id}`} description={`Created ${date(order.created_at || order.date)}`} action={<button className="admin-button primary" onClick={() => setConfirmEdit(true)}><FiEdit3 /> Edit order</button>} /><div className="admin-detail-grid"><DetailCard title="Customer" icon={<FiUsers />}><strong>{recordLabel(order.user) || order.customer_name || order.user_name || "Guest customer"}</strong><span>{order.customer_email || order.user_email || order.user?.email || "—"}</span></DetailCard><DetailCard title="Shipping address" icon={<FiTruck />}><span>{typeof order.shipping_address === "object" ? Object.values(order.shipping_address).filter(Boolean).join(", ") : order.shipping_address || "No address provided"}</span></DetailCard><DetailCard title="Status & payment" icon={<FiCreditCard />}><span>Order <StatusPill value={order.status} /></span><span>Payment <StatusPill value={order.payment_status} /></span></DetailCard></div><div className="admin-panel order-items-panel"><div className="admin-panel-heading"><div><h3>Order items</h3><p>Quantity, price, and product details</p></div><FiBox /></div>{items.length ? <div className="order-item-list">{items.map((item, index) => <div className="order-item" key={item.id || index}><div className="order-item-image">{item.product_image || item.image ? <img src={item.product_image || item.image} alt="" /> : <FiBox />}</div><div><strong>{recordLabel(item.product) || item.product_name || item.name || "Product"}</strong><span>Qty {item.quantity || 1}{item.color ? ` · ${recordLabel(item.color)}` : ""}{item.size || item.unit ? ` · ${recordLabel(item.size || item.unit)}` : ""}</span></div><strong>{money((item.price || 0) * (item.quantity || 1))}</strong></div>)}</div> : <EmptyState title="No order items" />}<div className="order-total"><span>Subtotal <strong>{money(order.subtotal || order.total_amount)}</strong></span><span>Discount <strong>- {money(order.discount)}</strong></span><span>Shipping <strong>{money(order.shipping_charge || order.shipping_fee)}</strong></span><span className="total"><b>Total</b><strong>{money(order.total_amount)}</strong></span></div></div>{confirmEdit && <ConfirmDialog title="Confirm order edit" message="Open this order for editing? Changes will be saved to the backend." onCancel={() => setConfirmEdit(false)} onConfirm={() => { setConfirmEdit(false); setEdit(true); }} />}{edit && <Modal onClose={() => setEdit(false)} title="Update order"><div className="admin-form"><label className="admin-form-field"><span>Order status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((option) => <option key={option}>{option}</option>)}</select></label><label className="admin-form-field"><span>Payment status</span><select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>{["Pending", "Paid", "Failed", "Refunded"].map((option) => <option key={option}>{option}</option>)}</select></label><div className="admin-modal-actions"><button className="admin-button secondary" onClick={() => setEdit(false)}>Cancel</button><button className="admin-button primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div></div></Modal>}</div>;
}
*/

function DetailCard({ title, icon, children }) { return <div className="admin-detail-card"><h3>{icon}{title}</h3><div>{children}</div></div>; }
