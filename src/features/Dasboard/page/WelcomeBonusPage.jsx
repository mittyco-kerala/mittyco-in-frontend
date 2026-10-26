import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FiEdit3, FiEye, FiPlus, FiPower, FiTrash2 } from "react-icons/fi";
import { ConfirmDialog, DataTable, DebouncedSearch, Modal, PageHeader, Pagination, StatusPill } from "../components/AdminPrimitives";
import { deleteResource, getErrorMessage, listResource, toggleWelcomeBonusActive, unwrapList } from "../services/adminApi";
import "../styles/WelcomeBonus.css";
import DirhamAmount from "../../../components/DirhamAmount";

const idOf = (value) => value?.id ?? value?.pk ?? value?.uuid ?? value;
const labelOf = (value, fallback = "—") => typeof value === "object" ? value?.name || value?.title || value?.label || fallback : value || fallback;
const date = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const targetType = (row) => String(row?.applicability_type || row?.apply_to || row?.target_type || (row?.category ? "CATEGORY" : "PRODUCT")).toUpperCase();
const applyTo = (row) => targetType(row).includes("CATEGORY") ? "Category Wise" : "Product Wise";
const discountType = (row) => String(row?.discount_type || (row?.fixed_amount != null ? "FIXED" : "PERCENTAGE")).toUpperCase().includes("FIXED") ? "Fixed Amount" : "Percentage";
const count = (...values) => {
    for (const value of values) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) return value.length;
        if (typeof value === "object") {
            const number = value.count ?? value.total ?? value.value;
            if (number !== undefined) return Number(number) || 0;
        }
        if (Number.isFinite(Number(value))) return Number(value);
    }
    return 0;
};

function targetName(row, products, categories) {
    if (row?.target_name) return row.target_name;
    const isCategory = targetType(row).includes("CATEGORY");
    const target = isCategory ? row?.category ?? row?.category_id : row?.product ?? row?.product_id ?? row?.products?.[0];
    if (typeof target === "object") return labelOf(target);
    const matches = (isCategory ? categories : products).find((item) => String(idOf(item)) === String(target));
    return labelOf(matches, target ? `${isCategory ? "Category" : "Product"} ${target}` : "—");
}

function WelcomeBonusView({ row, onClose }) {
    const details = [
        ["Name", row.name], ["Apply To", applyTo(row)], ["Target", row.target_name || labelOf(row.product || row.category)],
        ["Discount Type", discountType(row)], ["Discount", discountType(row) === "Fixed Amount" ? <DirhamAmount value={row.fixed_amount ?? row.discount_value ?? 0} /> : `${row.discount_percentage ?? row.discount_value ?? 0}%`],
        ["Start Date", date(row.start_date || row.valid_from)], ["End Date", date(row.end_date || row.valid_until)], ["Status", row.is_active ? "Active" : "Inactive"],
        ["Assigned Users", count(row.assigned_users, row.assigned_users_count, row.assignment_count, row.assignments)], ["Claimed Users", count(row.claimed_users, row.claimed_users_count, row.claim_count, row.claims)], ["Redeemed Users", count(row.redeemed_users, row.redeemed_users_count, row.redemption_count, row.redemptions)],
    ];
    return <Modal wide title="Welcome Bonus details" onClose={onClose}><dl className="welcome-bonus-details">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl><div className="admin-modal-actions"><button type="button" className="admin-button secondary" onClick={onClose}>Close</button></div></Modal>;
}

export default function WelcomeBonusPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [state, setState] = useState({ rows: [], count: 0, next: null, previous: null, loading: true, error: "" });
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [viewTarget, setViewTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [togglingId, setTogglingId] = useState(null);

    const params = useMemo(() => ({ page, page_size: pageSize, ...(search ? { search } : {}) }), [page, pageSize, search]);
    const reload = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: "" }));
        try {
            const response = await listResource("welcome-bonuses", params);
            setState({ ...unwrapList(response.data), loading: false, error: "" });
        } catch (error) {
            setState({ rows: [], count: 0, next: null, previous: null, loading: false, error: getErrorMessage(error, "Could not load Welcome Bonuses.") });
        }
    }, [params]);
    useEffect(() => {
        const timer = window.setTimeout(() => { void reload(); }, 0);
        return () => window.clearTimeout(timer);
    }, [reload]);
    useEffect(() => {
        let active = true;
        Promise.all([listResource("products", { page_size: 500 }), listResource("categories", { page_size: 500 })]).then(([productResponse, categoryResponse]) => {
            if (!active) return;
            setProducts(unwrapList(productResponse.data).rows);
            setCategories(unwrapList(categoryResponse.data).rows);
        }).catch(() => { if (active) { setProducts([]); setCategories([]); } });
        return () => { active = false; };
    }, []);

    const toggle = async (row) => {
        const id = idOf(row);
        if (togglingId) return;
        setTogglingId(id);
        try {
            await toggleWelcomeBonusActive(id);
            toast.success(`Welcome Bonus ${row.is_active ? "deactivated" : "activated"}`);
            await reload();
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not update Welcome Bonus status."));
        } finally { setTogglingId(null); }
    };
    const remove = async () => {
        try {
            await deleteResource("welcome-bonuses", idOf(deleteTarget));
            toast.success("Welcome Bonus deleted");
            setDeleteTarget(null);
            await reload();
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not delete Welcome Bonus."));
        }
    };
    const columns = [
        { key: "name", label: "Name", render: (row) => row.name || "—" },
        { key: "apply_to", label: "Apply To", render: applyTo },
        { key: "target", label: "Target", render: (row) => targetName(row, products, categories) },
        { key: "discount_type", label: "Discount Type", render: discountType },
        { key: "discount", label: "Discount", render: (row) => discountType(row) === "Fixed Amount" ? <DirhamAmount value={row.fixed_amount ?? row.discount_value ?? 0} /> : `${row.discount_percentage ?? row.discount_value ?? 0}%` },
        { key: "start_date", label: "Start Date", render: (row) => date(row.start_date || row.valid_from) },
        { key: "end_date", label: "End Date", render: (row) => date(row.end_date || row.valid_until) },
        { key: "status", label: "Status", render: (row) => <StatusPill value={row.is_active ? "Active" : "Inactive"} /> },
        { key: "assigned", label: "Assigned Users", render: (row) => count(row.assigned_users, row.assigned_users_count, row.assignment_count, row.assignments) },
        { key: "claimed", label: "Claimed Users", render: (row) => count(row.claimed_users, row.claimed_users_count, row.claim_count, row.claims) },
        { key: "redeemed", label: "Redeemed Users", render: (row) => count(row.redeemed_users, row.redeemed_users_count, row.redemption_count, row.redemptions) },
    ];

    return <div className="admin-page welcome-bonus-page"><PageHeader eyebrow="DASHBOARD" title="Welcome Bonuses" description="Create and manage customer-specific Welcome Bonus campaigns." action={<button className="admin-button primary" onClick={() => navigate("/mittyco-dashboard/welcome-bonuses/new")}><FiPlus /> Add Welcome Bonus</button>} /><div className="admin-panel"><div className="admin-filters"><div className="admin-filter-fields"><DebouncedSearch value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search Welcome Bonuses..." /></div><button type="button" className="admin-button secondary" onClick={() => { setSearch(""); setPage(1); }}>Clear filters</button></div><p className="welcome-bonus-scroll-hint">Swipe the table horizontally to view all columns and actions.</p><DataTable columns={columns} rows={state.rows} loading={state.loading} error={state.error} onRetry={reload} actions={(row) => <><button className="table-icon" title="View Welcome Bonus" aria-label="View Welcome Bonus" onClick={() => setViewTarget(row)}><FiEye /></button><button className="table-icon" title="Edit Welcome Bonus" aria-label="Edit Welcome Bonus" onClick={() => navigate(`/mittyco-dashboard/welcome-bonuses/${idOf(row)}/edit`)}><FiEdit3 /></button><button className="table-icon" title={row.is_active ? "Deactivate Welcome Bonus" : "Activate Welcome Bonus"} aria-label={row.is_active ? "Deactivate Welcome Bonus" : "Activate Welcome Bonus"} onClick={() => toggle(row)} disabled={togglingId === idOf(row)}><FiPower /></button><button className="table-icon danger" title="Delete or archive Welcome Bonus" aria-label="Delete Welcome Bonus" onClick={() => setDeleteTarget(row)}><FiTrash2 /></button></>} /><Pagination page={page} pageSize={pageSize} count={state.count} next={state.next} previous={state.previous} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} /></div>{viewTarget && <WelcomeBonusView row={{ ...viewTarget, target_name: targetName(viewTarget, products, categories) }} onClose={() => setViewTarget(null)} />}{deleteTarget && <ConfirmDialog title="Delete or archive Welcome Bonus" message="Delete this Welcome Bonus? Existing assignment history may be retained by the server." onCancel={() => setDeleteTarget(null)} onConfirm={remove} />}</div>;
}
