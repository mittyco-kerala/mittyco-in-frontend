import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, listResource, unwrapList } from "../services/adminApi";

export default function useAdminResource(resource, params = {}, enabled = true) {
    const [state, setState] = useState({ rows: [], count: 0, loading: enabled, error: "" });

    const load = useCallback(async () => {
        if (!enabled) return;
        setState((current) => ({ ...current, loading: true, error: "" }));
        try {
            const response = await listResource(resource, params);
            setState({ ...unwrapList(response.data), loading: false, error: "" });
        } catch (error) {
            setState({ rows: [], count: 0, loading: false, error: getErrorMessage(error, "Could not load this data") });
        }
    }, [enabled, resource, params]);

    useEffect(() => { load(); }, [load]);

    return { ...state, reload: load };
}
