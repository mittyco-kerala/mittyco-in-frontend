import { useEffect, useRef, useState } from "react";
import { FiBell, FiCheck, FiCopy, FiX } from "react-icons/fi";
import showToast from "../../../utils/toast";
import {
    claimWelcomeBonus,
    copyWelcomeBonusCode,
    getWelcomeBonusNotifications,
    markWelcomeBonusNotificationRead,
} from "../api/welcomeBonusApi";
import { hasAuthSession } from "../../auth/authUtils";
import "../styles/WelcomeBonusNotifications.css";

const MASKED_CODE = "••••••••••••••••";

function isAuthenticated() {
    return hasAuthSession();
}

function notificationRows(payload) {
    return Array.isArray(payload?.notifications) ? payload.notifications : [];
}

function maskedCode(notification) {
    const value = String(notification?.masked_code || "").trim();
    // Only accept an already-masked backend value. If a malformed API response
    // ever contains a real code, retain the safe UI fallback instead.
    return value && /[•*]/.test(value) ? value : MASKED_CODE;
}

export default function WelcomeBonusNotifications({ mobile = false }) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [actingId, setActingId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const panelRef = useRef(null);
    const triggerRef = useRef(null);

    const refresh = async () => {
        if (!isAuthenticated()) {
            setNotifications([]);
            setUnreadCount(0);
            return { notifications: [] };
        }

        setLoading(true);
        try {
            const response = await getWelcomeBonusNotifications();
            const payload = response?.data || {};
            setNotifications(notificationRows(payload));
            setUnreadCount(Number(payload.unread_count) || 0);
            return payload;
        } catch {
            // A notification failure must never interfere with the existing navbar.
            setNotifications([]);
            setUnreadCount(0);
            return { notifications: [] };
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => { void refresh(); }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setOpen(false);
        };
        const closeOnOutsideClick = (event) => {
            if (!panelRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener("keydown", closeOnEscape);
        document.addEventListener("mousedown", closeOnOutsideClick);
        return () => {
            document.removeEventListener("keydown", closeOnEscape);
            document.removeEventListener("mousedown", closeOnOutsideClick);
        };
    }, [open]);

    const openPanel = async () => {
        const nextOpen = !open;
        setOpen(nextOpen);
        if (!nextOpen || !isAuthenticated()) return;

        const latest = await refresh();
        const unread = notificationRows(latest).filter((notification) => !notification.is_read);
        if (!unread.length) return;
        try {
            await Promise.all(unread.map((notification) => markWelcomeBonusNotificationRead(notification.id)));
        } catch {
            // Refresh still obtains the latest server-side unread count.
        }
        refresh();
    };

    const claim = async (notificationId) => {
        if (actingId) return;
        setActingId(notificationId);
        try {
            await claimWelcomeBonus(notificationId);
            showToast.success("Welcome Bonus claimed");
            await refresh();
        } catch (error) {
            showToast.error(error?.response?.data?.message || error?.response?.data?.detail || "Could not claim Welcome Bonus.");
        } finally {
            setActingId(null);
        }
    };

    const copyCode = async (notificationId) => {
        if (actingId) return;
        setActingId(notificationId);
        try {
            const response = await copyWelcomeBonusCode(notificationId);
            if (!response?.data?.code || !navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
            await navigator.clipboard.writeText(response.data.code);
            setCopiedId(notificationId);
            window.setTimeout(() => setCopiedId((current) => current === notificationId ? null : current), 2000);
        } catch {
            showToast.error("Could not copy code. Please try again.");
        } finally {
            // The actual code is intentionally never set in React state, storage, logs, or a toast.
            setActingId(null);
        }
    };

    return <div className={`welcome-bonus-notifications ${mobile ? "welcome-bonus-notifications-mobile" : ""}`}>
        <button
            type="button"
            ref={triggerRef}
            className="notification-bell"
            onClick={openPanel}
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            aria-expanded={open}
            aria-haspopup="dialog"
        >
            <FiBell aria-hidden="true" />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </button>
        {open && <section className="notification-panel" ref={panelRef} role="dialog" aria-label="Welcome Bonus notifications">
            <header className="notification-panel-header"><div><strong>Notifications</strong><span>{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "All caught up"}</span></div><button type="button" onClick={() => setOpen(false)} aria-label="Close notifications"><FiX /></button></header>
            <div className="notification-list" aria-live="polite">
                {loading ? <p className="notification-state">Loading notifications…</p> : notifications.length === 0 ? <p className="notification-state">You have no Welcome Bonus notifications.</p> : notifications.map((notification) => <article className={`welcome-bonus-notification ${notification.is_read ? "is-read" : "is-unread"}`} key={notification.id}>
                    <div className="welcome-bonus-notification-copy"><div className="notification-title-row"><h3>{notification.title || "Welcome Bonus"}</h3>{!notification.is_read && <span className="notification-unread-mark">New</span>}</div><p>{notification.message}</p>{notification.discount_text && <strong className="welcome-bonus-discount">{notification.discount_text}</strong>}{notification.eligible_target && <p className="welcome-bonus-target">{notification.eligible_target}</p>}<p className="masked-redemption-code" aria-label="Redemption code is masked"><span>Code:</span> {maskedCode(notification)}</p></div>
                    <div className="welcome-bonus-actions">
                        {notification.can_claim && <button type="button" className="welcome-bonus-action claim" onClick={() => claim(notification.id)} disabled={actingId === notification.id}>{actingId === notification.id ? "Claiming…" : "Claim Welcome Bonus"}</button>}
                        {notification.can_copy_code && <button type="button" className="welcome-bonus-action copy" onClick={() => copyCode(notification.id)} disabled={actingId === notification.id}>{copiedId === notification.id ? <><FiCheck /> Copied ✓</> : <><FiCopy /> Copy Code</>}</button>}
                    </div>
                </article>)}</div>
        </section>}
    </div>;
}
