import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { createResource, getErrorMessage, getResource, updateResource } from "../services/adminApi";
import { LoadingState } from "../components/AdminPrimitives";
import "../styles/HeroBannerEditor.css";

const emptyBanner = { image: null, link: "", is_active: true };
const idOf = (row) => row?.id ?? row?.pk ?? row?.uuid;
const errorMap = (error) => { const data = error?.response?.data; return data && typeof data === "object" ? Object.fromEntries(Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : String(value)])) : {}; };

export default function HeroSideBannerEditor() {
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
        getResource("hero-side-banners", id).then((response) => setValues((current) => ({ ...current, ...response.data }))).catch((error) => setRequestError(getErrorMessage(error, "Could not load hero side banner."))).finally(() => setLoading(false));
        return undefined;
    }, [editing, id]);
    const setValue = (name, value) => setValues((current) => ({ ...current, [name]: value }));
    const save = async (mode = "list") => {
        if (!editing && !values.image) { setErrors({ image: "Image is required." }); setRequestError("Please correct the highlighted fields."); return; }
        setSaving(true); setErrors({}); setRequestError("");
        try {
            const form = new FormData();
            if (values.image instanceof File) form.append("image", values.image);
            if (values.link) form.append("link", values.link);
            form.append("is_active", String(Boolean(values.is_active)));
            const response = editing ? await updateResource("hero-side-banners", id, form, true) : await createResource("hero-side-banners", form, true);
            const savedId = id || idOf(response.data);
            toast.success(editing ? "Hero side banner updated" : "Hero side banner created");
            if (mode === "another") { setValues(emptyBanner); navigate("/mittyco-dashboard/hero-side-banners/new", { replace: true }); }
            else if (mode === "continue") navigate(`/mittyco-dashboard/hero-side-banners/${savedId}/edit`, { replace: true });
            else navigate("/mittyco-dashboard/hero-side-banners");
        } catch (error) { setErrors(errorMap(error)); setRequestError(getErrorMessage(error, "Could not save hero side banner.")); toast.error(getErrorMessage(error, "Could not save hero side banner.")); }
        finally { setSaving(false); }
    };
    if (loading) return <div className="admin-page"><LoadingState label="Loading hero side banner..." /></div>;
    return <div className="hero-banner-editor-page">
        <div className="hero-editor-heading"><div><button type="button" className="hero-back-link" onClick={() => navigate("/mittyco-dashboard/hero-side-banners")}><FiArrowLeft /> Hero side banners</button><h2>Hero side banners</h2></div><div className="hero-breadcrumb">Home&nbsp; / &nbsp;Myapp&nbsp; / &nbsp;Hero side banners&nbsp; / &nbsp;{editing ? "Edit hero side banner" : "Add hero side banner"}</div></div>
        <div className="hero-editor-layout"><section className="hero-editor-card"><div className="hero-editor-form">
            <label className="hero-editor-field"><span>Image <em>*</em></span><input type="file" accept="image/*" onChange={(event) => setValue("image", event.target.files?.[0] || null)} />{values.image && <img className="hero-upload-preview" src={values.image instanceof File ? URL.createObjectURL(values.image) : values.image} alt="Hero side preview" />}<small className="hero-field-help">The actual image file</small>{errors.image && <small>{errors.image}</small>}</label>
            <label className="hero-editor-field"><span>Link</span><input type="text" value={values.link ?? ""} onChange={(event) => setValue("link", event.target.value)} /><small className="hero-field-help">A URL where the user should be redirected if they click the banner</small></label>
            <label className="hero-editor-field"><span>Is active</span><input type="checkbox" checked={Boolean(values.is_active)} onChange={(event) => setValue("is_active", event.target.checked)} /><small className="hero-field-help">Only one banner should be active at a time</small></label>
        </div>{requestError && <p className="hero-editor-error">{requestError}</p>}</section><aside className="hero-editor-actions"><button className="hero-save-button" onClick={() => save("list")} disabled={saving}><FiSave /> Save</button><button className="hero-secondary-button" onClick={() => save("another")} disabled={saving}>Save and add another</button><button className="hero-secondary-button" onClick={() => save("continue")} disabled={saving}>Save and continue editing</button></aside></div>
    </div>;
}
