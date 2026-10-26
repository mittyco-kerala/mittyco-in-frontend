import { useEffect, useMemo, useState } from "react";

export default function ProductMessageRail({ messages = [] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [now, setNow] = useState(() => Date.now());
    const items = useMemo(() => (Array.isArray(messages) ? messages : []).filter((item) => {
        if (item?.is_active === false) return false;
        if (item?.message_type !== "countdown" || !item?.ends_at) return true;
        return new Date(item.ends_at).getTime() > now;
    }), [messages, now]);
    const current = items.length ? items[activeIndex % items.length] : null;
    const hasCountdown = items.some((item) => item?.message_type === "countdown" && item?.ends_at);
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

    const backgroundColor = /^#[0-9A-Fa-f]{6}$/.test(current.background_color || "")
        ? current.background_color
        : "#EAF4FF";
    const textColor = /^#[0-9A-Fa-f]{6}$/.test(current.text_color || "")
        ? current.text_color
        : "#173B35";
    const label = current.text;

    return (
        <div className="product-message-rail" style={{ "--product-message-bg": backgroundColor, "--product-message-color": textColor }} aria-live="polite" aria-atomic="true">
            <span className="product-message-label">{label}</span>
        </div>
    );
}
