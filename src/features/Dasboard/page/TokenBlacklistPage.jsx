import { useCallback, useEffect, useMemo, useState } from "react";
import { FiSlash } from "react-icons/fi";
import { toast } from "sonner";
import { ConfirmDialog, DataTable, PageHeader, Pagination, SearchBar, StatusPill } from "../components/AdminPrimitives";
import { blacklistToken, getBlacklistedTokens, getErrorMessage, getOutstandingTokens, unwrapList } from "../services/adminApi";
import "../styles/TokenBlacklist.css";

const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const tokenIsBlacklisted = (value) => value === true || String(value).toLowerCase() === "true";

function userLabel(row) {
    return row?.user_email || "Unknown user";
}

export default function TokenBlacklistPage({ type }) {
    const outstanding = type === "outstanding";
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [state, setState] = useState({ rows: [], count: 0, next: null, previous: null, loading: true, error: "" });
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [blacklisting, setBlacklisting] = useState(false);
    const params = useMemo(() => ({ page, page_size: pageSize, ...(search ? { search } : {}) }), [page, pageSize, search]);

    const reload = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: "" }));
        try {
            const response = await (outstanding ? getOutstandingTokens(params) : getBlacklistedTokens(params));
            setState({ ...unwrapList(response.data), loading: false, error: "" });
        } catch (error) {
            setState({ rows: [], count: 0, next: null, previous: null, loading: false, error: getErrorMessage(error, "Could not load token records.") });
        }
    }, [outstanding, params]);

    useEffect(() => {
        const timer = window.setTimeout(() => { void reload(); }, 0);
        return () => window.clearTimeout(timer);
    }, [reload]);

    const confirmBlacklist = async () => {
        if (!confirmTarget || blacklisting) return;
        setBlacklisting(true);
        try {
            const response = await blacklistToken(confirmTarget.id);
            const alreadyBlacklisted = Boolean(response?.data?.already_blacklisted);
            toast.success(alreadyBlacklisted ? "Token was already blacklisted." : "Token blacklisted.");
            setConfirmTarget(null);
            await reload();
        } catch (error) {
            toast.error(getErrorMessage(error, "Could not blacklist token."));
        } finally {
            setBlacklisting(false);
        }
    };

    const columns = outstanding ? [
        { key: "user", label: "User", render: userLabel },
        { key: "jti", label: "JTI", render: (row) => row?.jti || "—" },
        { key: "created_at", label: "Created At", render: (row) => formatDateTime(row?.created_at) },
        { key: "expires_at", label: "Expires At", render: (row) => formatDateTime(row?.expires_at) },
        { key: "status", label: "Status", render: (row) => <StatusPill value={tokenIsBlacklisted(row?.is_blacklisted) ? "Blacklisted" : "Active"} /> },
    ] : [
        { key: "user", label: "User", render: userLabel },
        { key: "jti", label: "JTI", render: (row) => row?.jti || "—" },
        { key: "token_created_at", label: "Token Created At", render: (row) => formatDateTime(row?.token_created_at) },
        { key: "token_expires_at", label: "Token Expires At", render: (row) => formatDateTime(row?.token_expires_at) },
        { key: "blacklisted_at", label: "Blacklisted At", render: (row) => formatDateTime(row?.blacklisted_at) },
        { key: "status", label: "Status", render: () => <StatusPill value="Blacklisted" /> },
    ];
    const title = outstanding ? "Outstanding Tokens" : "Blacklisted Tokens";

    return <div className="admin-page token-blacklist-page">
        <PageHeader eyebrow="TOKEN BLACKLIST" title={title} description={outstanding ? "Manage outstanding refresh-token metadata. Token values are never displayed." : "Read-only metadata for revoked refresh tokens. Token values are never displayed."} />
        <div className="admin-panel">
            <div className="admin-filters">
                <div className="admin-filter-fields"><SearchBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search user email or JTI..." /></div>
                <button type="button" className="admin-button secondary" onClick={() => { setSearch(""); setPage(1); }}>Clear filters</button>
            </div>
            <p className="token-blacklist-scroll-hint">Swipe the table horizontally to view all token metadata.</p>
            <DataTable columns={columns} rows={state.rows} loading={state.loading} error={state.error} onRetry={reload} actions={outstanding ? (row) => !tokenIsBlacklisted(row?.is_blacklisted) && <button type="button" className="admin-button danger token-blacklist-action" aria-label="Blacklist active token" onClick={() => setConfirmTarget(row)}><FiSlash aria-hidden="true" /> Blacklist Token</button> : undefined} />
            <Pagination page={page} pageSize={pageSize} count={state.count} next={state.next} previous={state.previous} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
        </div>
        {confirmTarget && <ConfirmDialog title="Blacklist Token" message="Blacklist this refresh token? The affected user will need to sign in again." confirmLabel="Blacklist Token" loadingLabel="Blacklisting..." loading={blacklisting} onCancel={() => { if (!blacklisting) setConfirmTarget(null); }} onConfirm={confirmBlacklist} />}
    </div>;
}
