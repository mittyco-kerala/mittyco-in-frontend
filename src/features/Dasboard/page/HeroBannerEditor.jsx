import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { createResource, getErrorMessage, getResource, updateResource } from "../services/adminApi";
import { LoadingState } from "../components/AdminPrimitives";
import "../styles/HeroBannerEditor.css";

const emptyBanner = { subtitle: "", title: "", description: "", image: null, button_text: "Explore Collection", display_order: 1, is_active: true };
const fields = [
    { name: "subtitle", label: "Subtitle" },
    { name: "title", label: "Title" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "image", label: "Image", required: true, type: "image" },
    { name: "button_text", label: "Button text" },
    { name: "display_order", label: "Display order", required: true, type: "integer", min: 0 },
    { name: "is_active", label: "Is active", type: "boolean" },
];
const optionalTextFields = new Set(["subtitle", "title", "description", "button_text"]);

const idOf = (row) => row?.id ?? row?.pk ?? row?.uuid;
const errorMap = (error) => { const data = error?.response?.data; return data && typeof data === "object" ? Object.fromEntries(Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : String(value)])) : {}; };

export default function HeroBannerEditor({ schema = {} }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const editing = Boolean(id);
    const [values, setValues] = useState(emptyBanner);
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [requestError, setRequestError] = useState("");
    const schemaFields = useMemo(() => {
        const raw = schema?.hero_banners || schema?.["hero-banners"];
        const list = Array.isArray(raw) ? raw : raw?.fields || [];
        return list.length ? list : fields;
    }, [schema]);

    useEffect(() => {
        if (!editing) return undefined;
        getResource("hero-banners", id).then((response) => setValues((current) => ({ ...current, ...response.data }))).catch((error) => setRequestError(getErrorMessage(error, "Could not load hero banner."))).finally(() => setLoading(false));
        return undefined;
    }, [editing, id]);

    const setValue = (name, value) => setValues((current) => ({ ...current, [name]: value }));
    const payload = () => {
        const form = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            if (["id", "pk", "created_at", "updated_at"].includes(key)) return;
            if (key === "image") { if (value instanceof File) form.append(key, value); return; }
            if (optionalTextFields.has(key)) { form.append(key, value ?? ""); return; }
            if (value !== undefined && value !== null && value !== "") form.append(key, value);
        });
        return form;
    };
    const validate = () => {
        const requiredErrors = fields
            .filter((field) => field.required && !String(values[field.name] ?? "").trim())
            .filter((field) => field.name !== "image" || !editing)
            .map((field) => [field.name, `${field.label} is required.`]);
        return Object.fromEntries(requiredErrors);
    };
    const save = async (mode = "list") => {
        const validation = validate();
        if (Object.keys(validation).length) { setErrors(validation); setRequestError("Please correct the highlighted fields."); return; }
        setSaving(true); setErrors({}); setRequestError("");
        try {
            const data = payload();
            const response = editing ? await updateResource("hero-banners", id, data, true) : await createResource("hero-banners", data, true);
            const savedId = id || idOf(response.data);
            toast.success(editing ? "Hero banner updated" : "Hero banner created");
            if (mode === "another") { setValues(emptyBanner); navigate("/mittyco-dashboard/hero-banners/new", { replace: true }); }
            else if (mode === "continue") navigate(`/mittyco-dashboard/hero-banners/${savedId}/edit`, { replace: true });
            else navigate("/mittyco-dashboard/hero-banners");
        } catch (error) { setErrors(errorMap(error)); setRequestError(getErrorMessage(error, "Could not save hero banner.")); toast.error(getErrorMessage(error, "Could not save hero banner.")); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="admin-page"><LoadingState label="Loading hero banner…" /></div>;
    return <div className="hero-banner-editor-page">
        <div className="hero-editor-heading"><div><button type="button" className="hero-back-link" onClick={() => navigate("/mittyco-dashboard/hero-banners")}><FiArrowLeft /> Hero banners</button><h2>Hero banners</h2></div><div className="hero-breadcrumb">Home&nbsp; / &nbsp;Myapp&nbsp; / &nbsp;Hero banners&nbsp; / &nbsp;{editing ? "Edit hero banner" : "Add hero banner"}</div></div>
        <div className="hero-editor-layout"><section className="hero-editor-card"><div className="hero-editor-form">{fields.map((field) => { const value = values[field.name]; const schemaField = schemaFields.find((item) => (item.name || item.key) === field.name) || field; const type = field.type || schemaField.type || "text"; return <label className={`hero-editor-field ${errors[field.name] ? "has-error" : ""}`} key={field.name}><span>{field.label}{field.required && <em> *</em>}</span>{type === "boolean" ? <input type="checkbox" checked={Boolean(value)} onChange={(event) => setValue(field.name, event.target.checked)} /> : type === "textarea" ? <textarea rows="7" value={value || ""} onChange={(event) => setValue(field.name, event.target.value)} /> : type === "image" ? <><input type="file" accept="image/*" onChange={(event) => setValue(field.name, event.target.files?.[0] || null)} />{value && <img className="hero-upload-preview" src={value instanceof File ? URL.createObjectURL(value) : value} alt="Hero preview" />}</> : <input type={type === "integer" || type === "number" ? "number" : "text"} min={field.min} value={value ?? ""} onChange={(event) => setValue(field.name, event.target.value)} />}{errors[field.name] && <small>{errors[field.name]}</small>}</label>; })}</div>{requestError && <p className="hero-editor-error">{requestError}</p>}</section><aside className="hero-editor-actions"><button className="hero-save-button" onClick={() => save("list")} disabled={saving}><FiSave /> Save</button><button className="hero-secondary-button" onClick={() => save("another")} disabled={saving}>Save and add another</button><button className="hero-secondary-button" onClick={() => save("continue")} disabled={saving}>Save and continue editing</button></aside></div>
    </div>;
}
