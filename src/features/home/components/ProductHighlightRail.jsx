import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiBox, FiClock, FiShield, FiStar, FiTag, FiTruck, FiZap } from "react-icons/fi";

const ICONS = {
    tag: FiTag,
    clock: FiClock,
    truck: FiTruck,
    zap: FiZap,
    fire: FiActivity,
    shield: FiShield,
    sparkles: FiStar,
    box: FiBox,
    star: FiStar,
};

export default function ProductHighlightRail({ highlights = [], placement = "rail" }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [now, setNow] = useState(() => Date.now());
    const items = useMemo(() => (Array.isArray(highlights) ? highlights : []).filter((item) => {
        if (item?.is_active === false) return false;
        if (item?.highlight_type !== "countdown" || !item?.ends_at) return true;
        return new Date(item.ends_at).getTime() > now;
    }), [highlights, now]);
    const current = items.length ? items[activeIndex % items.length] : null;
    const hasCountdown = items.some((item) => item?.highlight_type === "countdown" && item?.ends_at);
    const currentId = current?.id;
    const rotationSeconds = Math.max(2, Number(current?.rotation_seconds) || 4);

    useEffect(() => {
        if (!hasCountdown) return undefined;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [hasCountdown]);

    useEffect(() => {
        if (!currentId || items.length < 2) return undefined;
        const timer = window.setTimeout(() => setActiveIndex((index) => (index + 1) % items.length), rotationSeconds * 1000);
        return () => window.clearTimeout(timer);
    }, [currentId, items.length, rotationSeconds]);

    if (!current) return null;

    const Icon = ICONS[current.icon_key] || FiTag;
    const backgroundColor = /^#[0-9A-Fa-f]{6}$/.test(current.background_color || "")
        ? current.background_color
        : "#EAF4FF";
    const textColor = /^#[0-9A-Fa-f]{6}$/.test(current.text_color || "")
        ? current.text_color
        : "#173B35";
    const label = current.text;

    return (
        <div
            className={`product-highlight-rail ${placement === "badge" ? "product-highlight-rail--badge" : ""}`}
            style={{ "--product-highlight-bg": backgroundColor, "--product-highlight-color": textColor }}
            aria-live="polite"
            aria-atomic="true"
        >
            {placement !== "badge" && <span className="product-highlight-icon" aria-hidden="true"><Icon /></span>}
            <span className="product-highlight-label">{label}</span>
        </div>
    );
}
