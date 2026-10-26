import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FiArrowDown, FiArrowUp, FiChevronDown, FiImage, FiPlus, FiSave, FiTrash2, FiX } from "react-icons/fi";
import { ConfirmDialog, EmptyState, LoadingState, StatusPill } from "../components/AdminPrimitives";
import { createResource, deleteResource, flattenApiErrors, getErrorMessage, getResource, listResource, setPrimaryResource, updateResource } from "../services/adminApi";
import { getImageUrl } from "../../../utils/imageUrl";
import "../styles/ProductEditor.css";

const emptyProduct = {
    name: "", description: "", key_features: "", category: "", subcategory: "", brand: "", offer: "",
    seller_name: "", shipping_fee: "0", estimated_delivery_time: "", warranty_info: "",
    current_viewers_count: "0", promotional_banner_image: null, promotional_banner_link: "",
    is_active: true, related_product_mode: "none", related_product_ids: [], manual_related_products: [],
};

const emptyVariant = (product = "") => ({
    product, color: "", sku: "", price_type: "single", price: "", stock: "",
    units: [], images: [], deletedUnits: [], deletedImages: [],
});

const rows = (payload) => Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
const idOf = (item) => item?.id ?? item?.pk ?? item?.uuid;
const valueOf = (item) => typeof item === "object" && item !== null ? item.id ?? item.pk : item ?? "";
const labelOf = (item) => item?.name || item?.title || item?.email || item?.code || `#${idOf(item)}`;
const relationId = (item) => item?.id ?? item?.pk ?? item?.uuid ?? item;

function toOptions(payload, labelKeys = ["name", "title", "email", "code"]) {
    return rows(payload).map((item) => ({
        value: idOf(item), label: labelKeys.map((key) => item[key]).find(Boolean) || labelOf(item),
        category: relationId(item.category || item.category_id), unitType: relationId(item.unit_type || item.unit_type_id),
    }));
}

function sortImages(images = []) { return [...images].sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0)); }
function imageIdentity(image) {
    const path = String(image?.image || image?.url || "").split("?")[0].replace(/^\/+/, "").toLowerCase();
    if (path) return `path:${path}`;
    if (image?.file) return `file:${image.file.name}:${image.file.size}:${image.file.lastModified}`;
    return `id:${idOf(image)}`;
}
function deduplicateImages(images = []) {
    const seen = new Set();
    const duplicateIds = [];
    const unique = sortImages(images).filter((image) => {
        const identity = imageIdentity(image);
        if (seen.has(identity)) {
            if (idOf(image)) duplicateIds.push(idOf(image));
            return false;
        }
        seen.add(identity);
        return true;
    });
    return { images: unique, duplicateIds };
}

export default function ProductEditor({ readOnly = false }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const editing = Boolean(id);
    const [product, setProduct] = useState(emptyProduct);
    const [variants, setVariants] = useState([]);
    const [dropdowns, setDropdowns] = useState({ categories: [], subcategories: [], brands: [], offers: [], colors: [], unitTypes: [], units: [], products: [], sellerNames: [] });
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [initialSnapshot, setInitialSnapshot] = useState(() => editing ? "" : JSON.stringify({ product: emptyProduct, variants: [] }));
    const [openSections, setOpenSections] = useState({ information: true, category: true, offer: true, sales: true, promotional: true, related: true, status: true, variants: true });
    const [relatedSearch, setRelatedSearch] = useState("");

    useEffect(() => {
        let active = true;
        const loadDropdowns = async () => {
            const names = ["categories", "subcategories", "offers", "colors", "unit-types", "units", "products"];
            const [results, brands] = await Promise.all([
                Promise.all(names.map((resource) => listResource(resource, { page_size: 500 }).then((response) => response.data).catch(() => ({ results: [] })))),
                // Brands created in the dashboard are available through the
                // authenticated admin endpoint, not the public brands endpoint.
                listResource("brands", { page_size: 500 }).then((response) => response.data).catch(() => ({ results: [] }))
            ]);
            if (!active) return;
            const sellerNames = [...new Set(rows(results[6]).map((product) => String(product.seller_name || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
            setDropdowns({ categories: toOptions(results[0]), subcategories: toOptions(results[1]), brands: toOptions(brands), offers: toOptions(results[2]), colors: toOptions(results[3]), unitTypes: toOptions(results[4]), units: toOptions(results[5]), products: toOptions(results[6]), sellerNames });
        };
        loadDropdowns().catch((requestError) => { if (active) setError(getErrorMessage(requestError, "Could not load product options.")); });
        if (!editing) return () => { active = false; };
        loadProduct(id).then((loaded) => {
            if (!active) return;
            setProduct(loaded.product); setVariants(loaded.variants); setInitialSnapshot(JSON.stringify({ product: loaded.product, variants: loaded.variants }));
        }).catch((requestError) => { if (active) setError(getErrorMessage(requestError, "Could not load product.")); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [editing, id]);

    const filteredSubcategories = useMemo(() => dropdowns.subcategories.filter((item) => !product.category || String(item.category) === String(product.category)), [dropdowns.subcategories, product.category]);
    const currentSnapshot = JSON.stringify({ product, variants });
    const hasUnsavedChanges = Boolean(initialSnapshot && initialSnapshot !== currentSnapshot);
    useEffect(() => { const warn = (event) => { if (hasUnsavedChanges) { event.preventDefault(); event.returnValue = ""; } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [hasUnsavedChanges]);

    const leaveEditor = () => { if (!hasUnsavedChanges || window.confirm("You have unsaved changes. Leave without saving?")) navigate("/mittyco-dashboard/products"); };
    const toggle = (section) => setOpenSections((current) => ({ ...current, [section]: !current[section] }));
    const updateProduct = (name, value) => setProduct((current) => ({ ...current, [name]: value }));
    const selectedRelatedIds = Array.isArray(product.related_product_ids) ? product.related_product_ids.map(String) : [];
    const relatedProductOptions = dropdowns.products.filter((option) => String(option.value) !== String(id || "") && !selectedRelatedIds.includes(String(option.value)));
    const selectRelatedProduct = (option) => {
        if (!option || selectedRelatedIds.length >= 4) return;
        setProduct((current) => ({
            ...current,
            related_product_ids: [...(current.related_product_ids || []), option.value],
            manual_related_products: [...(current.manual_related_products || []), { id: option.value, name: option.label, position: (current.related_product_ids || []).length }],
        }));
        setRelatedSearch("");
    };
    const removeRelatedProduct = (relatedId) => setProduct((current) => {
        const ids = (current.related_product_ids || []).filter((value) => String(value) !== String(relatedId));
        return { ...current, related_product_ids: ids, manual_related_products: (current.manual_related_products || []).filter((item) => String(relationId(item)) !== String(relatedId)).map((item, position) => ({ ...item, position })) };
    });
    const moveRelatedProduct = (index, direction) => setProduct((current) => {
        const targetIndex = index + direction;
        const ids = [...(current.related_product_ids || [])];
        const items = [...(current.manual_related_products || [])];
        if (targetIndex < 0 || targetIndex >= ids.length) return current;
        [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
        [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
        return { ...current, related_product_ids: ids, manual_related_products: items.map((item, position) => ({ ...item, position })) };
    });
    const changeRelatedProductMode = (mode) => setProduct((current) => ({
        ...current,
        related_product_mode: mode,
        related_product_ids: mode === "manual" ? current.related_product_ids || [] : [],
        manual_related_products: mode === "manual" ? current.manual_related_products || [] : [],
    }));
    const addVariant = () => setVariants((current) => [...current, emptyVariant(id || "")]);
    const updateVariant = (index, name, value) => {
        if (name === "color" && !value && variants.some((variant, variantIndex) => variantIndex !== index && !variant.color)) {
            setFieldErrors((current) => ({ ...current, [`variant_${index}_color`]: "A product can have only one variant without a color." })); return;
        }
        setFieldErrors((current) => { const next = { ...current }; delete next[`variant_${index}_${name}`]; return next; });
        setVariants((current) => current.map((variant, variantIndex) => variantIndex === index ? { ...variant, [name]: value } : variant));
    };
    const removeVariant = (index) => setDeleteTarget({ type: "variant", index, id: idOf(variants[index]) });
    const confirmDelete = async () => {
        const target = deleteTarget; setDeleteTarget(null); if (!target) return;
        if (target.id) { try { await deleteResource("product-variants", target.id); toast.success("Variant deleted"); } catch (requestError) { toast.error(getErrorMessage(requestError, "Could not delete variant.")); return; } }
        setVariants((current) => current.filter((_, index) => index !== target.index));
    };

    const validate = () => {
        const errors = {};
        if (!String(product.name || "").trim()) errors.name = "Product name is required.";
        if (!String(product.description || "").trim()) errors.description = "Description is required.";
        if (!product.category) errors.category = "Category is required.";
        if (!product.subcategory) errors.subcategory = "Subcategory is required.";
        const subcategory = dropdowns.subcategories.find((item) => String(item.value) === String(product.subcategory));
        if (subcategory && String(subcategory.category) !== String(product.category)) errors.subcategory = "The subcategory must belong to the selected category.";
        if (product.related_product_mode === "manual" && selectedRelatedIds.length > 4) errors.related_product_ids = "Choose no more than four related products.";
        const colorlessIndexes = [];
        variants.forEach((variant, index) => {
            if (!variant.color) colorlessIndexes.push(index);
            if (variant.price_type === "single") {
                if (variant.price === "" || !Number.isFinite(Number(variant.price)) || Number(variant.price) <= 0) errors[`variant_${index}_price`] = "A single-price variant requires a positive price.";
                if (variant.stock === "" || !Number.isFinite(Number(variant.stock)) || Number(variant.stock) < 0) errors[`variant_${index}_stock`] = "Stock is required and cannot be negative.";
            } else {
                if (!variant.units.length) errors[`variant_${index}_units`] = "Add at least one unit for a multiple-price variant.";
                variant.units.forEach((unit, unitIndex) => {
                    const prefix = `variant_${index}_unit_${unitIndex}`; const unitOption = dropdowns.units.find((option) => String(option.value) === String(unit.unit)); const belongs = unitOption && String(unitOption.unitType) === String(unit.unit_type);
                    if (!unit.unit_type) errors[`${prefix}_unit_type`] = "Unit type is required.";
                    if (!unit.unit) errors[`${prefix}_unit`] = "Unit is required."; else if (!belongs) errors[`${prefix}_unit`] = "The selected unit does not belong to this unit type.";
                    if (unit.price === "" || !Number.isFinite(Number(unit.price)) || Number(unit.price) <= 0) errors[`${prefix}_price`] = "Unit price is required and must be positive.";
                    if (unit.stock === "" || !Number.isFinite(Number(unit.stock)) || Number(unit.stock) < 0) errors[`${prefix}_stock`] = "Unit stock is required and cannot be negative.";
                });
            }
        });
        if (colorlessIndexes.length > 1) { errors.variant_colorless = "A product can have only one variant without a color."; colorlessIndexes.slice(1).forEach((index) => { errors[`variant_${index}_color`] = errors.variant_colorless; }); }
        return errors;
    };

    const save = async (event) => {
        event.preventDefault(); if (readOnly) return;
        const validation = validate(); if (Object.keys(validation).length) { setFieldErrors(validation); setError(Object.values(validation).join(" ")); return; }
        if (!window.confirm(editing ? "Save changes to this product?" : "Create this product?")) return;
        setSaving(true); setError(""); setFieldErrors({}); let activeVariantIndex = -1; let activeUnitIndex = -1;
        try {
            const productPayload = makeProductPayload(product);
            const productResponse = editing ? await updateResource("products", id, productPayload) : await createResource("products", productPayload);
            const productId = id || idOf(productResponse.data); if (!productId) throw new Error("The product response did not contain an id.");
            for (let index = 0; index < variants.length; index += 1) {
                activeVariantIndex = index; const variant = variants[index];
                const variantPayload = { product: productId, color: variant.color || null, price_type: variant.price_type, stock: variant.price_type === "single" ? Number(variant.stock) : 0 };
                if (String(variant.sku || "").trim()) variantPayload.sku = String(variant.sku).trim();
                if (variant.price_type === "single") variantPayload.price = Number(variant.price);
                const variantResponse = idOf(variant) ? await updateResource("product-variants", idOf(variant), variantPayload) : await createResource("product-variants", variantPayload);
                const variantId = idOf(variant) || idOf(variantResponse.data); if (!variantId) throw new Error("The variant response did not contain an id.");
                if (variant.price_type === "single") for (const unitId of [...variant.deletedUnits, ...variant.units.map(idOf).filter(Boolean)]) await deleteResource("product-variant-units", unitId);
                else { for (const unitId of variant.deletedUnits) await deleteResource("product-variant-units", unitId); for (let unitIndex = 0; unitIndex < variant.units.length; unitIndex += 1) { activeUnitIndex = unitIndex; const unit = variant.units[unitIndex]; const unitPayload = { variant: variantId, unit_type: unit.unit_type, unit: unit.unit, price: Number(unit.price), stock: Number(unit.stock) }; if (String(unit.sku || "").trim()) unitPayload.sku = String(unit.sku).trim(); if (idOf(unit)) await updateResource("product-variant-units", idOf(unit), unitPayload); else await createResource("product-variant-units", unitPayload); } activeUnitIndex = -1; }
                await saveVariantImages(variantId, variant);
                const refreshedImages = sortImages(rows((await listResource("product-images", { variant: variantId, page_size: 500 })).data));
                setVariants((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, id: idOf(item) || variantId, images: refreshedImages, deletedImages: [] } : item));
            }
            toast.success(editing ? "Product updated successfully" : "Product created successfully"); navigate(`/mittyco-dashboard/products/${productId}`, { replace: true });
        } catch (requestError) {
            const backendErrors = flattenApiErrors(requestError?.response?.data); const mappedErrors = { ...backendErrors };
            Object.entries(backendErrors).forEach(([key, message]) => { if (activeVariantIndex >= 0 && ["sku", "color", "price", "stock", "price_type"].includes(key)) mappedErrors[`variant_${activeVariantIndex}_${key}`] = message; if (activeVariantIndex >= 0 && activeUnitIndex >= 0 && ["sku", "unit", "unit_type", "price", "stock"].includes(key)) mappedErrors[`variant_${activeVariantIndex}_unit_${activeUnitIndex}_${key}`] = message; });
            setFieldErrors(mappedErrors); setError(getErrorMessage(requestError, "Could not save product.")); toast.error(getErrorMessage(requestError, "Could not save product."));
        } finally { setSaving(false); }
    };

    if (loading) return <div className="admin-page"><LoadingState label="Loading product editor..." /></div>;
    return <div className="admin-page product-editor-page"><button className="admin-back-link" onClick={leaveEditor}>Back to Products</button><div className="admin-page-header"><div><p className="admin-eyebrow">PRODUCT MANAGEMENT</p><h2>{editing ? "Edit Product" : "Create Product"}</h2><p>Manage product details, variants, units, and images.</p></div><button className="admin-button primary" onClick={save} disabled={saving}><FiSave /> {saving ? "Saving..." : "Save Product"}</button></div>{error && <div className="admin-form-error product-editor-error">{error}</div>}<form onSubmit={save}>
        <EditorSection title="Product Information" open={openSections.information} onToggle={() => toggle("information")}><div className="product-form-grid"><TextField label="Product name" required value={product.name} onChange={(value) => updateProduct("name", value)} error={fieldErrors.name} /><TextAreaField label="Description" required value={product.description} onChange={(value) => updateProduct("description", value)} error={fieldErrors.description} /><TextAreaField label="Key features" hint="Enter one feature per line" value={product.key_features} onChange={(value) => updateProduct("key_features", value)} /></div></EditorSection>
        <EditorSection title="Category Details" open={openSections.category} onToggle={() => toggle("category")}><div className="product-form-grid two"><SelectField label="Category" required value={product.category} options={dropdowns.categories} onChange={(value) => { updateProduct("category", value); if (product.subcategory && !dropdowns.subcategories.some((item) => String(item.value) === String(product.subcategory) && String(item.category) === String(value))) updateProduct("subcategory", ""); }} error={fieldErrors.category} /><SelectField label="Subcategory" required value={product.subcategory} options={filteredSubcategories} onChange={(value) => updateProduct("subcategory", value)} error={fieldErrors.subcategory} /><SelectField label="Brand" value={product.brand} options={dropdowns.brands} emptyLabel="No brand" onChange={(value) => updateProduct("brand", value)} /></div></EditorSection>
        <EditorSection title="Offer Details" open={openSections.offer} onToggle={() => toggle("offer")}><div className="product-form-grid two"><SelectField label="Offer" value={product.offer} options={dropdowns.offers} emptyLabel="No offer" onChange={(value) => updateProduct("offer", value)} /></div></EditorSection>
         <EditorSection title="Sales & Delivery" open={openSections.sales} onToggle={() => toggle("sales")}><div className="product-form-grid two"><TextField label="Seller / Vendor name" value={product.seller_name} onChange={(value) => updateProduct("seller_name", value)} suggestions={dropdowns.sellerNames} /><NumberField label="Shipping fee" min="0" step="0.01" value={product.shipping_fee} onChange={(value) => updateProduct("shipping_fee", value)} /><TextField label="Estimated delivery time" value={product.estimated_delivery_time} onChange={(value) => updateProduct("estimated_delivery_time", value)} /><TextField label="Warranty information" value={product.warranty_info} onChange={(value) => updateProduct("warranty_info", value)} /></div></EditorSection>
        <EditorSection title="Promotional & Social" open={openSections.promotional} onToggle={() => toggle("promotional")}><div className="product-form-grid two"><NumberField label="Current viewers count" min="0" step="1" value={product.current_viewers_count} onChange={(value) => updateProduct("current_viewers_count", value)} /><FileField label="Promotional banner image" value={product.promotional_banner_image} onChange={(value) => updateProduct("promotional_banner_image", value)} /><TextField label="Promotional banner link" value={product.promotional_banner_link} onChange={(value) => updateProduct("promotional_banner_link", value)} /></div></EditorSection>
        <EditorSection title="Related Products" open={openSections.related} onToggle={() => toggle("related")}><RelatedProductsSection mode={product.related_product_mode} onModeChange={changeRelatedProductMode} relatedProducts={product.manual_related_products || []} search={relatedSearch} onSearchChange={setRelatedSearch} availableProducts={relatedProductOptions} onSelect={selectRelatedProduct} onRemove={removeRelatedProduct} onMove={moveRelatedProduct} error={fieldErrors.related_product_ids} /></EditorSection>
        <EditorSection title="Status" open={openSections.status} onToggle={() => toggle("status")}><label className="product-toggle"><input type="checkbox" checked={Boolean(product.is_active)} onChange={(event) => updateProduct("is_active", event.target.checked)} /> Active</label></EditorSection>
        <EditorSection title="Product Variants & Images" open={openSections.variants} onToggle={() => toggle("variants")}><div className="variant-section-heading"><div><strong>Variants</strong><span>Use Single Price for one price/stock pair, or Multiple Price for unit-specific prices.</span></div><button type="button" className="admin-button secondary" onClick={addVariant}><FiPlus /> Add Variant</button></div>{fieldErrors.variant_colorless && <small className="product-error">{fieldErrors.variant_colorless}</small>}{variants.length ? variants.map((variant, index) => <VariantCard key={idOf(variant) || `new-${index}`} variant={variant} index={index} colors={dropdowns.colors} unitTypes={dropdowns.unitTypes} units={dropdowns.units} fieldErrors={fieldErrors} onChange={updateVariant} onDelete={removeVariant} onConfirmTypeChange={(nextType) => changeVariantType(variants, setVariants, index, nextType)} onAddUnit={() => addUnit(setVariants, index)} onRemoveUnit={(unitIndex) => removeUnit(setVariants, index, unitIndex)} onAddImage={(file) => addImage(setVariants, index, file)} onRemoveImage={(imageIndex) => removeImage(setVariants, index, imageIndex)} onMoveImage={(from, to) => moveImage(setVariants, index, from, to)} />) : <EmptyState title="No variants yet" description="Add a variant to configure pricing, stock, and images." />}</EditorSection>
        <div className="product-editor-footer"><button type="button" className="admin-button secondary" onClick={leaveEditor}>Cancel</button><button className="admin-button primary" disabled={saving}><FiSave /> {saving ? "Saving..." : "Save Product"}</button></div>
    </form>{deleteTarget && <ConfirmDialog title="Delete variant" message="Delete this variant and its linked units and images?" onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}</div>;
}

async function loadProduct(id) {
    const productResponse = await getResource("products", id); const product = normalizeProduct(productResponse.data); const variantResponse = await listResource("product-variants", { product: id, page_size: 500 });
    const variants = await Promise.all(rows(variantResponse.data).map(async (variant) => { const [unitResponse, imageResponse] = await Promise.all([listResource("product-variant-units", { variant: idOf(variant), page_size: 500 }), listResource("product-images", { variant: idOf(variant), page_size: 500 })]); const deduplicated = deduplicateImages(rows(imageResponse.data).map((image) => ({ ...image, file: null }))); return { ...variant, product: valueOf(variant.product) || id, color: valueOf(variant.color), sku: variant.sku || "", price_type: variant.price_type || "single", price: variant.price ?? "", stock: variant.stock ?? "", units: rows(unitResponse.data).map(normalizeUnit), images: deduplicated.images, deletedUnits: [], deletedImages: deduplicated.duplicateIds }; }));
    return { product, variants };
}

function normalizeProduct(data = {}) { const productData = { ...data }; delete productData.emi_available; delete productData.emi_starting_price; const manualRelated = rows(data.manual_related_products).sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0)); const relatedIds = (Array.isArray(data.related_product_ids) && data.related_product_ids.length ? data.related_product_ids : manualRelated.map(relationId)).map(relationId); const relatedMode = ["none", "manual", "automatic"].includes(data.related_product_mode) ? data.related_product_mode : relatedIds.length ? "manual" : "none"; return { ...emptyProduct, ...productData, category: valueOf(data.category), subcategory: valueOf(data.subcategory), brand: valueOf(data.brand), offer: valueOf(data.offer), key_features: Array.isArray(data.key_features) ? data.key_features.join("\n") : data.key_features || "", promotional_banner_image: data.promotional_banner_image || null, related_product_mode: relatedMode, related_product_ids: relatedIds, manual_related_products: manualRelated.map((item, position) => ({ ...item, id: relationId(item), position })) }; }
function normalizeUnit(unit) { return { ...unit, sku: unit.sku || "", unit_type: valueOf(unit.unit_type), unit: valueOf(unit.unit) }; }
function makeProductPayload(product) { const values = { ...product, key_features: Array.isArray(product.key_features) ? product.key_features.join("\n") : String(product.key_features || ""), category: product.category || null, subcategory: product.subcategory || null, brand: product.brand || null, offer: product.offer || null, shipping_fee: product.shipping_fee === "" ? 0 : Number(product.shipping_fee), current_viewers_count: product.current_viewers_count === "" ? 0 : Number(product.current_viewers_count), related_product_mode: product.related_product_mode || "none", related_product_ids: product.related_product_mode === "manual" ? (product.related_product_ids || []).map(relationId) : [] }; delete values.product_type; delete values.has_variants; delete values.variants; delete values.units; delete values.images; delete values.regions; delete values.emi_available; delete values.emi_starting_price; delete values.manual_related_products; const file = values.promotional_banner_image instanceof File ? values.promotional_banner_image : null; if (!file) { delete values.promotional_banner_image; return values; } const form = new FormData(); Object.entries(values).forEach(([key, value]) => { if (value === null || value === undefined) return; if (Array.isArray(value)) value.forEach((item) => form.append(key, String(item))); else form.append(key, value); }); form.set("promotional_banner_image", file); return form; }
async function saveVariantImages(variantId, variant) {
    for (const imageId of variant.deletedImages) await deleteResource("product-images", imageId);
    const images = variant.images || [];
    if (!images.length) return;

    // Save the collection first, then use the dedicated atomic endpoint to
    // select the requested image.  The model keeps at least one primary image,
    // so changing the primary cannot be lost while sibling rows are updated.
    const primaryIndex = Math.max(0, images.findIndex((image) => image.is_primary));
    let primaryImageId = null;
    for (let position = 0; position < images.length; position += 1) {
        const image = images[position];
        if (image.file) {
            const form = new FormData();
            form.append("variant", variantId);
            form.append("image", image.file);
            form.append("position", String(position));
            form.append("is_primary", "false");
            const response = await createResource("product-images", form);
            if (position === primaryIndex) primaryImageId = idOf(response.data);
        } else if (idOf(image)) {
            await updateResource("product-images", idOf(image), { position, is_primary: false });
            if (position === primaryIndex) primaryImageId = idOf(image);
        }
    }
    if (primaryImageId) await setPrimaryResource("product-images", primaryImageId);
}

function RelatedProductsSection({ mode, onModeChange, relatedProducts, search, onSearchChange, availableProducts, onSelect, onRemove, onMove, error }) {
    const normalizedMode = ["none", "manual", "automatic"].includes(mode) ? mode : "none";
    const query = String(search || "").trim().toLowerCase();
    const matches = availableProducts.filter((product) => !query || String(product.label || "").toLowerCase().includes(query)).slice(0, 8);
    const hasReachedLimit = relatedProducts.length >= 4;
    return <div className="related-products-editor">
        <p className="related-products-editor-copy">Choose how customers should be offered complementary products after adding this item to their cart.</p>
        <fieldset className="related-mode-control"><legend>Mode</legend>{[["none", "None"], ["manual", "Manual"], ["automatic", "Automatic"]].map(([value, label]) => <label key={value}><input type="radio" name="related-product-mode" value={value} checked={normalizedMode === value} onChange={() => onModeChange(value)} /> {label}</label>)}</fieldset>
        {normalizedMode === "automatic" && <p className="related-products-automatic">Related products will be automatically selected based on category, subcategory, product relevance, brand, and availability.</p>}
        {normalizedMode === "manual" && <div className="related-products-manual">
            <div className="related-products-manual-heading"><div><strong>Manual selections</strong><span>Select up to four products. Their order is the order shown to customers.</span></div><span className="related-products-count">{relatedProducts.length}/4</span></div>
            {relatedProducts.length > 0 && <ol className="related-products-selected-list">{relatedProducts.map((product, index) => <li key={relationId(product)}><span className="related-products-position" aria-hidden="true">{index + 1}</span><strong>{product.name || product.title || `Product #${relationId(product)}`}</strong><div className="related-products-item-actions"><button type="button" className="table-icon" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Move ${product.name || "product"} up`}><FiArrowUp /></button><button type="button" className="table-icon" onClick={() => onMove(index, 1)} disabled={index === relatedProducts.length - 1} aria-label={`Move ${product.name || "product"} down`}><FiArrowDown /></button><button type="button" className="table-icon danger" onClick={() => onRemove(relationId(product))} aria-label={`Remove ${product.name || "product"}`}><FiX /></button></div></li>)}</ol>}
            {!hasReachedLimit && <div className="related-products-search"><label htmlFor="related-product-search">Find a product to add</label><input id="related-product-search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search products by name" autoComplete="off" />{query && <div className="related-products-search-results" role="listbox" aria-label="Matching products">{matches.length ? matches.map((product) => <button type="button" role="option" key={product.value} onClick={() => onSelect(product)}>{product.label}</button>) : <p>No matching products found.</p>}</div>}</div>}
            {hasReachedLimit && <p className="related-products-limit">You can select a maximum of four related products.</p>}
            {error && <small className="product-error">{error}</small>}
        </div>}
    </div>;
}

function EditorSection({ title, open, onToggle, children }) { return <section className="product-editor-section"><button type="button" className="product-section-heading" onClick={onToggle}><strong>{title}</strong><FiChevronDown className={open ? "section-open" : ""} /></button>{open && <div className="product-section-content">{children}</div>}</section>; }
function TextField({ label, value, onChange, error, required, hint, suggestions = [] }) { const listId = suggestions.length ? `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-suggestions` : undefined; return <label className={`product-field ${error ? "has-error" : ""}`}><span>{label}{required && " *"}</span><input value={value || ""} list={listId} autoComplete="off" onChange={(event) => onChange(event.target.value)} />{listId && <datalist id={listId}>{suggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist>}{hint && <small className="field-hint">{hint}</small>}{error && <small>{error}</small>}</label>; }
function NumberField({ label, value, onChange, min, step = "0.01", error }) { return <label className={`product-field ${error ? "has-error" : ""}`}><span>{label}</span><input type="number" min={min} step={step} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />{error && <small>{error}</small>}</label>; }
function TextAreaField({ label, value, onChange, error, required, hint }) { return <label className={`product-field full ${error ? "has-error" : ""}`}><span>{label}{required && " *"}</span><textarea rows="5" value={value || ""} onChange={(event) => onChange(event.target.value)} />{hint && <small className="field-hint">{hint}</small>}{error && <small>{error}</small>}</label>; }
function SelectField({ label, value, options: optionRows, onChange, error, required, emptyLabel = "Select" }) { return <label className={`product-field ${error ? "has-error" : ""}`}><span>{label}{required && " *"}</span><select value={value || ""} onChange={(event) => onChange(event.target.value)}><option value="">{emptyLabel}</option>{optionRows.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{error && <small>{error}</small>}</label>; }
function FileField({ label, value, onChange }) { const preview = value instanceof File ? URL.createObjectURL(value) : value; return <label className="product-field"><span>{label}</span><input type="file" accept="image/*" onChange={(event) => onChange(event.target.files?.[0] || null)} />{preview && <img className="editor-image-preview" src={preview} alt="Preview" />}</label>; }

function VariantCard({ variant, index, colors, unitTypes, units, fieldErrors, onChange, onDelete, onConfirmTypeChange, onAddUnit, onRemoveUnit, onAddImage, onRemoveImage, onMoveImage }) {
    return <article className="variant-card"><div className="variant-card-heading"><div><strong>Variant {index + 1}</strong> {variant.price_type === "multiple" ? <StatusPill value="Multiple Price" /> : <StatusPill value="Single Price" />}</div><button type="button" className="table-icon danger" onClick={() => onDelete(index)}><FiTrash2 /></button></div><div className="product-form-grid two"><SelectField label="Color" value={variant.color} options={colors} onChange={(value) => onChange(index, "color", value)} error={fieldErrors[`variant_${index}_color`]} /><TextField label="SKU (optional)" value={variant.sku} onChange={(value) => onChange(index, "sku", value)} error={fieldErrors[`variant_${index}_sku`]} hint="SKU (Stock Keeping Unit) is a unique code for this variant. Example: TSHIRT-BLUE-M" /><fieldset className="price-type-field"><legend>Price Type</legend><label><input type="radio" checked={variant.price_type === "single"} onChange={() => onConfirmTypeChange("single")} /> Single Price</label><label><input type="radio" checked={variant.price_type === "multiple"} onChange={() => onConfirmTypeChange("multiple")} /> Multiple Price</label></fieldset></div>{variant.price_type === "single" ? <div className="product-form-grid two"><NumberField label="Price" min="0.01" value={variant.price} onChange={(value) => onChange(index, "price", value)} error={fieldErrors[`variant_${index}_price`]} /><NumberField label="Stock" min="0" step="1" value={variant.stock} onChange={(value) => onChange(index, "stock", value)} error={fieldErrors[`variant_${index}_stock`]} /></div> : <UnitTable units={variant.units} unitTypes={unitTypes} unitOptions={units} errors={fieldErrors} variantIndex={index} onAdd={onAddUnit} onRemove={onRemoveUnit} onChange={(unitIndex, key, value) => onChange(index, "units", variant.units.map((unit, current) => current === unitIndex ? { ...unit, [key]: value } : unit))} />}<div className="variant-images"><div className="variant-subheading"><strong>Product images</strong><label className="admin-button secondary"><FiImage /> Add Image<input hidden type="file" accept="image/*" onChange={(event) => { if (event.target.files?.[0]) onAddImage(event.target.files[0]); event.target.value = ""; }} /></label></div><div className="variant-image-grid">{variant.images.map((image, imageIndex) => <div className="variant-image-item" draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", String(imageIndex))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData("text/plain")); if (Number.isInteger(from)) onMoveImage(from, imageIndex); }} key={idOf(image) || `${imageIndex}-${image.image}`}><img src={image.file ? URL.createObjectURL(image.file) : getImageUrl(image.image)} alt="Product" /><span className="image-position">{imageIndex + 1}</span><label className="primary-image-check"><input type="radio" name={`primary-image-${index}`} checked={Boolean(image.is_primary)} onChange={() => onChange(index, "images", variant.images.map((item, current) => ({ ...item, is_primary: current === imageIndex })))} /> Primary</label><button type="button" onClick={() => onRemoveImage(imageIndex)} aria-label="Delete image"><FiX /></button></div>)}</div></div></article>;
}

function UnitTable({ units, unitTypes, unitOptions, errors, variantIndex, onAdd, onRemove, onChange }) {
    return <div className="unit-table"><div className="variant-subheading"><div><strong>Variant Units</strong>{errors[`variant_${variantIndex}_units`] && <small className="product-error">{errors[`variant_${variantIndex}_units`]}</small>}</div><button type="button" className="admin-button secondary" onClick={onAdd}><FiPlus /> Add Unit</button></div>{units.map((unit, index) => { const filteredUnits = unitOptions.filter((option) => !unit.unit_type || String(option.unitType) === String(unit.unit_type)); const prefix = `variant_${variantIndex}_unit_${index}`; return <div className="editor-unit-row" key={idOf(unit) || index}><select value={unit.unit_type || ""} onChange={(event) => { const nextType = event.target.value; const valid = unitOptions.some((option) => String(option.value) === String(unit.unit) && String(option.unitType) === String(nextType)); onChange(index, "unit_type", nextType); if (!valid) onChange(index, "unit", ""); }}><option value="">Unit Type *</option>{unitTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><select value={unit.unit || ""} onChange={(event) => onChange(index, "unit", event.target.value)}><option value="">Unit *</option>{filteredUnits.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><TextField label="SKU" value={unit.sku} onChange={(value) => onChange(index, "sku", value)} error={errors[`${prefix}_sku`]} hint="SKU (Stock Keeping Unit) is a unique code for this unit. Example: TSHIRT-BLUE-M" /><input type="number" min="0.01" step="0.01" placeholder="Price *" value={unit.price ?? ""} onChange={(event) => onChange(index, "price", event.target.value)} /><input type="number" min="0" step="1" placeholder="Stock *" value={unit.stock ?? ""} onChange={(event) => onChange(index, "stock", event.target.value)} /><button type="button" className="table-icon danger" onClick={() => onRemove(index)} aria-label="Delete unit"><FiTrash2 /></button>{errors[`${prefix}_unit_type`] && <small className="product-error">{errors[`${prefix}_unit_type`]}</small>}{errors[`${prefix}_unit`] && <small className="product-error">{errors[`${prefix}_unit`]}</small>}{errors[`${prefix}_price`] && <small className="product-error">{errors[`${prefix}_price`]}</small>}{errors[`${prefix}_stock`] && <small className="product-error">{errors[`${prefix}_stock`]}</small>}</div>; })}</div>;
}

function changeVariantType(variants, setVariants, index, nextType) { const variant = variants[index]; if (variant.price_type === nextType) return; if (nextType === "single" && variant.units.length && !window.confirm("Switching to Single Price will clear the unit rows. Continue?")) return; setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price_type: nextType, units: nextType === "single" ? [] : item.units, deletedUnits: nextType === "single" ? [...item.deletedUnits, ...item.units.map(idOf).filter(Boolean)] : item.deletedUnits, price: nextType === "multiple" ? "" : item.price, stock: nextType === "multiple" ? 0 : item.stock } : item)); }
function addUnit(setVariants, index) { setVariants((current) => current.map((variant, variantIndex) => variantIndex === index ? { ...variant, units: [...variant.units, { unit_type: "", unit: "", sku: "", price: "", stock: "" }] } : variant)); }
function removeUnit(setVariants, index, unitIndex) { if (!window.confirm("Delete this unit?")) return; setVariants((current) => current.map((variant, variantIndex) => { if (variantIndex !== index) return variant; const unit = variant.units[unitIndex]; return { ...variant, units: variant.units.filter((_, currentIndex) => currentIndex !== unitIndex), deletedUnits: idOf(unit) ? [...variant.deletedUnits, idOf(unit)] : variant.deletedUnits }; })); }
function addImage(setVariants, index, file) { setVariants((current) => current.map((variant, variantIndex) => { if (variantIndex !== index || variant.images.some((image) => imageIdentity({ file }) === imageIdentity(image))) return variant; return { ...variant, images: [...variant.images, { file, image: "", is_primary: variant.images.length === 0, position: variant.images.length }] }; })); }
function removeImage(setVariants, index, imageIndex) { if (!window.confirm("Delete this product image?")) return; setVariants((current) => current.map((variant, variantIndex) => { if (variantIndex !== index) return variant; const image = variant.images[imageIndex]; const images = variant.images.filter((_, currentIndex) => currentIndex !== imageIndex); if (image.is_primary && images[0]) images[0] = { ...images[0], is_primary: true }; return { ...variant, images, deletedImages: idOf(image) ? [...variant.deletedImages, idOf(image)] : variant.deletedImages }; })); }
function moveImage(setVariants, index, from, to) { if (from === to) return; setVariants((current) => current.map((variant, variantIndex) => { if (variantIndex !== index) return variant; const images = [...variant.images]; const [moved] = images.splice(from, 1); images.splice(to, 0, moved); return { ...variant, images }; })); }
