import { useMemo } from "react";

export default function useFormErrors(error) {
    return useMemo(() => {
        const payload = error?.response?.data;
        if (!payload || typeof payload !== "object") return {};
        const flatten = (value) => {
            if (Array.isArray(value)) return value.map((item) => typeof item === "object" ? flatten(item) : String(item)).join(", ");
            if (value && typeof value === "object") return Object.values(value).map(flatten).join(" ");
            return String(value);
        };
        return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, flatten(value)]));
    }, [error]);
}
