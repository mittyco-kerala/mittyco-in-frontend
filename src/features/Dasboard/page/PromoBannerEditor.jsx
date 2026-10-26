import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { createResource, getErrorMessage, getResource, updateResource } from "../services/adminApi";
import { LoadingState } from "../components/AdminPrimitives";
import "../styles/HeroBannerEditor.css";

const emptyBanner = { image: null, link: "", is_active: true };
const fields = [
    { name: "image", label: "Image", required: true, type: "image", help: "The promotional banner image" },
    { name: "link", label: "Link", type: "text", help: "A URL where the user should be redirected if they click the banner" },
    { name: "is_active", label: "Is active", type: "boolean", help: "To easily turn individual banners on or off" },
];
const idOf = (row) => row?.id ?? row?.pk ?? row?.uuid;
const errorMap = (error) => { const data = error?.response?.data; return data && typeof data === "object" ? Object.fromEntries(Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : String(value)])) : {}; };

export default function PromoBannerEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const editing = Boolean(id);
    const [values, setValues] = useState(emptyBanner);
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [requestError, setRequestError] = useState("");

    useEffect(() => {
        if (!editing) return undefined;
        getResource("promo-banners", id).then((response) => setValues((current) => ({ ...current, ...response.data }))).catch((error) => setRequestError(getErrorMessage(error, "Could not load promotional banner."))).finally(() => setLoading(false));
        return undefined;
    }, [editing, id]);

    const setValue = (name, value) => setValues((current) => ({ ...current, [name]: value }));
    const validate = () => (!editing && !values.image ? { image: "Image is required." } : {});
    const save = async (mode = "list") => {
        const validation = validate();
        if (Object.keys(validation).length) { setErrors(validation); setRequestError("Please correct the highlighted fields."); return; }
        setSaving(true); setErrors({}); setRequestError("");
        try {
            const form = new FormData();
            if (values.image instanceof File) form.append("image", values.image);
            if (values.link) form.append("link", values.link);
            form.append("is_active", String(Boolean(values.is_active)));
            const response = editing ? await updateResource("promo-banners", id, form, true) : await createResource("promo-banners", form, true);
            const savedId = id || idOf(response.data);
            toast.success(editing ? "Promotional banner updated" : "Promotional banner created");
            if (mode === "another") { setValues(emptyBanner); navigate("/mittyco-dashboard/promo-banners/new", { replace: true }); }
            else if (mode === "continue") navigate(`/mittyco-dashboard/promo-banners/${savedId}/edit`, { replace: true });
            else navigate("/mittyco-dashboard/promo-banners");
        } catch (error) { setErrors(errorMap(error)); setRequestError(getErrorMessage(error, "Could not save promotional banner.")); toast.error(getErrorMessage(error, "Could not save promotional banner.")); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="admin-page"><LoadingState label="Loading promotional banner..." /></div>;
    return <div className="hero-banner-editor-page">
        <div className="hero-editor-heading"><div><button type="button" className="hero-back-link" onClick={() => navigate("/mittyco-dashboard/promo-banners")}><FiArrowLeft /> Promo banners</button><h2>Promo banners</h2></div><div className="hero-breadcrumb">Home&nbsp; / &nbsp;Myapp&nbsp; / &nbsp;Promo banners&nbsp; / &nbsp;{editing ? "Edit promo banner" : "Add promo banner"}</div></div>
        <div className="hero-editor-layout"><section className="hero-editor-card"><div className="hero-editor-form">{fields.map((field) => { const value = values[field.name]; return <label className="hero-editor-field" key={field.name}><span>{field.label}{field.required && <em> *</em>}</span>{field.type === "boolean" ? <input type="checkbox" checked={Boolean(value)} onChange={(event) => setValue(field.name, event.target.checked)} /> : field.type === "image" ? <><input type="file" accept="image/*" onChange={(event) => setValue(field.name, event.target.files?.[0] || null)} />{value && <img className="hero-upload-preview" src={value instanceof File ? URL.createObjectURL(value) : value} alt="Promo preview" />}</> : <input type="text" value={value ?? ""} onChange={(event) => setValue(field.name, event.target.value)} />}{field.help && <small className="hero-field-help">{field.help}</small>}{errors[field.name] && <small>{errors[field.name]}</small>}</label>; })}</div>{requestError && <p className="hero-editor-error">{requestError}</p>}</section><aside className="hero-editor-actions"><button className="hero-save-button" onClick={() => save("list")} disabled={saving}><FiSave /> Save</button><button className="hero-secondary-button" onClick={() => save("another")} disabled={saving}>Save and add another</button><button className="hero-secondary-button" onClick={() => save("continue")} disabled={saving}>Save and continue editing</button></aside></div>
    </div>;
}
