import { useEffect, useMemo, useRef, useState } from "react";
import { FiAlertCircle, FiChevronLeft, FiChevronRight, FiSearch, FiX } from "react-icons/fi";
import { getImageUrl } from "../../../utils/imageUrl";

export function Skeleton({ className = "" }) {
    return <span className={`admin-skeleton ${className}`} aria-hidden="true" />;
}

export function TableSkeleton({ columns = 5, rows = 6 }) {
    const gridStyle = { gridTemplateColumns: `minmax(150px, 1.35fr) repeat(${Math.max(columns - 1, 1)}, minmax(90px, 1fr))` };
    return <div className="admin-table-skeleton" aria-label="Loading records" role="status">
        <div className="admin-table-skeleton-head" style={gridStyle}>{Array.from({ length: columns }, (_, index) => <Skeleton key={`head-${index}`} className="skeleton-head-cell" />)}</div>
        {Array.from({ length: rows }, (_, rowIndex) => <div className="admin-table-skeleton-row" style={gridStyle} key={`row-${rowIndex}`}>{Array.from({ length: columns }, (_, columnIndex) => <Skeleton key={`${rowIndex}-${columnIndex}`} className={columnIndex === 0 ? "skeleton-primary-cell" : "skeleton-cell"} />)}</div>)}
    </div>;
}

export function LoadingState({ label = "Loading..." }) {
    return <div className="admin-state admin-loading admin-loading-surface" role="status" aria-label={label}>
        <div className="admin-loading-card" aria-hidden="true">
            <Skeleton className="admin-loading-heading" />
            <Skeleton className="admin-loading-line wide" />
            <Skeleton className="admin-loading-line" />
            <Skeleton className="admin-loading-line short" />
        </div>
    </div>;
}

export function EmptyState({ title = "No records found", description = "Try changing your search or create a new record." }) {
    return <div className="admin-state"><FiSearch aria-hidden="true" /><strong>{title}</strong><span>{description}</span></div>;
}

export function ErrorState({ message, onRetry }) {
    return <div className="admin-state admin-error" role="alert"><FiAlertCircle aria-hidden="true" /><strong>{message}</strong>{onRetry && <button type="button" className="admin-button secondary" onClick={onRetry}>Try again</button>}</div>;
}

export function SearchBar({ value, onChange, placeholder = "Search..." }) {
    return <label className="admin-search"><FiSearch aria-hidden="true" /><input aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

export function FilterBar({ children, onClear }) {
    return <div className="admin-filters"><div className="admin-filter-fields">{children}</div>{onClear && <button type="button" className="admin-button secondary" onClick={onClear}>Clear filters</button>}</div>;
}

export function Pagination({ page, pageSize, count, next, previous, onPageChange, onPageSizeChange }) {
    const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
    const hasPrevious = previous === undefined ? page > 1 : Boolean(previous);
    const hasNext = next === undefined ? page < totalPages : Boolean(next);
    return <div className="admin-pagination">
        <span aria-live="polite">{count ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, count)} of ${count}` : "0 records"}</span>
        <div className="admin-pagination-actions">
            <label>Rows <select aria-label="Rows per page" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label>
            <button type="button" disabled={!hasPrevious} onClick={() => onPageChange(page - 1)} aria-label="Previous page"><FiChevronLeft aria-hidden="true" /></button>
            <strong aria-label={`Page ${page} of ${totalPages}`}>{page} / {totalPages}</strong>
            <button type="button" disabled={!hasNext} onClick={() => onPageChange(page + 1)} aria-label="Next page"><FiChevronRight aria-hidden="true" /></button>
        </div>
    </div>;
}

export function ConfirmDialog({ title = "Confirm delete", message, onConfirm, onCancel, loading = false, confirmLabel = "Delete", loadingLabel = "Deleting..." }) {
    return <Modal onClose={onCancel}>
        <div className="confirm-dialog"><div className="confirm-icon"><FiAlertCircle aria-hidden="true" /></div><h3>{title}</h3><p>{message || "This action cannot be undone."}</p><div className="admin-modal-actions"><button type="button" className="admin-button secondary" onClick={onCancel} disabled={loading}>Cancel</button><button type="button" className="admin-button danger" onClick={onConfirm} disabled={loading}>{loading ? loadingLabel : confirmLabel}</button></div></div>
    </Modal>;
}

export function Modal({ children, title, onClose, wide = false }) {
    return <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
        <div className={`admin-modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={title ? "admin-modal-title" : undefined}>
            {title && <div className="admin-modal-heading"><div><p className="admin-eyebrow">ADMINISTRATION</p><h3 id="admin-modal-title">{title}</h3></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><FiX aria-hidden="true" /></button></div>}
            {children}
        </div>
    </div>;
}

export function DataTable({ columns, rows, loading, error, onRetry, onRowClick, actions }) {
    if (loading) return <TableSkeleton columns={columns.length + (actions ? 1 : 0)} />;
    if (error) return <ErrorState message={error} onRetry={onRetry} />;
    if (!rows.length) return <EmptyState />;
    return <div className="admin-table-wrap"><table className="admin-table"><caption className="sr-only">Dashboard records</caption><thead><tr>{columns.map((column) => <th scope="col" key={column.key}>{column.label}</th>)}{actions && <th scope="col">Actions</th>}</tr></thead><tbody>{rows.map((row) => <tr key={row.id ?? row.pk ?? row.uuid} onClick={() => onRowClick?.(row)} tabIndex={onRowClick ? 0 : undefined} onKeyDown={(event) => { if (onRowClick && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onRowClick(row); } }}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : formatCell(row[column.key])}</td>)}{actions && <td onClick={(event) => event.stopPropagation()}><div className="table-actions">{actions(row)}</div></td>}</tr>)}</tbody></table></div>;
}

function formatCell(value) {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "object") return value.name || value.label || value.email || JSON.stringify(value);
    return String(value);
}

export function StatusPill({ value }) {
    return <span className={`status-pill ${String(value || "unknown").toLowerCase().replaceAll(" ", "-")}`}>{value || "-"}</span>;
}

export function DebouncedSearch({ value, onChange, ...props }) {
    const [local, setLocal] = useState(value || "");
    const timerRef = useRef(null);
    useEffect(() => { clearTimeout(timerRef.current); }, [value]);
    useEffect(() => () => clearTimeout(timerRef.current), []);
    const handleChange = (nextValue) => { setLocal(nextValue); clearTimeout(timerRef.current); timerRef.current = setTimeout(() => onChange(nextValue), 350); };
    return <SearchBar {...props} value={value !== local ? value : local} onChange={handleChange} />;
}

export function PageHeader({ eyebrow = "ADMINISTRATION", title, description, action }) {
    return <div className="admin-page-header"><div><p className="admin-eyebrow">{eyebrow}</p><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}

export function FormField({ field, value, onChange, options = [], error, readOnly = false }) {
    const name = field.name || field.key;
    const label = field.label || name.replaceAll("_", " ");
    const type = String(field.type || field.field_type || "text").toLowerCase();
    const choices = field.choices?.length ? field.choices : field.options?.length ? field.options : options;
    const isBoolean = type === "boolean" || type === "bool" || type.includes("boolean");
    const isColor = type === "color";
    const isDate = type.includes("date") || type.includes("time");
    const isNumber = ["integer", "number", "decimal", "float"].some((numberType) => type.includes(numberType));
    const isFile = type === "file" || type === "image" || name.includes("image") || name.includes("logo");
    const isPassword = name === "password" || type.includes("password");
    const isMultiple = Boolean(field.multiple || field.many || field.many_to_many || type.includes("manytomany"));
    const isTextArea = type === "text" || type === "textarea" || name.includes("description") || name.includes("features");
    const preview = useMemo(() => value instanceof File ? URL.createObjectURL(value) : typeof value === "string" ? getImageUrl(value) : "", [value]);
    useEffect(() => () => { if (value instanceof File && preview) URL.revokeObjectURL(preview); }, [preview, value]);
    const selectValue = isMultiple ? (Array.isArray(value) ? value.map((item) => typeof item === "object" ? item.id ?? item.value : item) : []) : (typeof value === "object" && value !== null ? value.id ?? value.value ?? "" : value ?? "");
    return <label className={`admin-form-field ${error ? "has-error" : ""}`}><span>{label}{field.required && <em> *</em>}</span>{isBoolean ? <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(name, event.target.checked)} disabled={readOnly} /> : isFile ? <><input type="file" accept="image/*" onChange={(event) => onChange(name, event.target.files?.[0] || null)} disabled={readOnly} />{preview && <img className="admin-image-preview" src={preview} alt={`${label} preview`} />}</> : choices.length ? <select aria-label={label} multiple={isMultiple} value={selectValue} onChange={(event) => onChange(name, isMultiple ? Array.from(event.target.selectedOptions, (option) => option.value) : event.target.value)} disabled={readOnly}>{!isMultiple && <option value="">Select {label}</option>}{choices.map((choice) => { const option = Array.isArray(choice) ? { value: choice[0], label: choice[1] } : typeof choice === "object" ? choice : { value: choice, label: choice }; return <option key={String(option.value ?? option.id)} value={option.value ?? option.id}>{option.label ?? option.name ?? option.value}</option>; })}</select> : isTextArea ? <textarea aria-label={label} rows={name.includes("description") ? 4 : 3} value={value ?? ""} onChange={(event) => onChange(name, event.target.value)} readOnly={readOnly} /> : <input aria-label={label} type={isColor ? "color" : isPassword ? "password" : isDate ? (type.includes("time") ? "datetime-local" : "date") : isNumber ? "number" : "text"} value={value ?? (isColor ? "#EAF4FF" : "")} min={field.min} max={field.max} step={field.step} onChange={(event) => onChange(name, event.target.value)} readOnly={readOnly} />}{isPassword && <small className="field-hint">Password must be at least 8 characters long and include letters, numbers, and symbols.</small>}{error && <small className="field-error">{error}</small>}</label>;
}

