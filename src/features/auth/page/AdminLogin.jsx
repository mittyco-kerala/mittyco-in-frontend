import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import client, { getRetryAfterSeconds } from "../../../lib/ApiClient";
import { isSuperAdminUser, saveAuthSession, clearAuthSession } from "../authUtils";
import { getApiErrorMessage } from "../../../lib/apiResponse";
import "./Login.css";

export default function AdminLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState(location.state?.accessDenied ? "Super Admin access required. Please sign in with a Super Admin account." : "");
    const [loading, setLoading] = useState(false);
    const [retryAfter, setRetryAfter] = useState(0);

    useEffect(() => {
        if (retryAfter <= 0) return undefined;
        const timer = window.setInterval(() => setRetryAfter((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => window.clearInterval(timer);
    }, [retryAfter]);

    const submit = async (event) => {
        event.preventDefault(); setLoading(true); setError("");
        try {
            const response = await client.post("login/", { ...form, login_type: "super_admin" });
            const user = response.data.user || response.data;
            if (!isSuperAdminUser(user)) { clearAuthSession(); setError("Super Admin access required."); return; }
            saveAuthSession(response.data);
            const requestedPath = location.state?.from;
            const requestedPathname = requestedPath?.pathname || "";
            const isDashboardPath = /^\/(?:mittyco-dashboard|order-dashboard|orderDashboard)(?:\/|$)/i.test(requestedPathname);
            const isAdminLoginPath = /\/admin-login$/i.test(requestedPathname);
            const destination = isDashboardPath && !isAdminLoginPath
                ? `${requestedPathname}${requestedPath.search || ""}${requestedPath.hash || ""}`
                : "/mittyco-dashboard";
            navigate(destination, { replace: true });
        } catch (requestError) {
            if (requestError.response?.status === 429) {
                const seconds = getRetryAfterSeconds(requestError);
                setRetryAfter(seconds);
                setError(`Too many attempts. Try again after ${seconds} seconds.`);
            } else if (requestError.response?.status === 403) {
                setError(requestError.response?.data?.detail || "Only Super Admin accounts can access this login.");
            } else {
                setError(getApiErrorMessage(requestError, "Invalid email or password."));
            }
        } finally { setLoading(false); }
    };
    return <div className="login-container"><div className="login-wrapper"><div className="login-box"><div className="auth-header"><h1>Super Admin Login</h1><p>Sign in to manage the Mittyco dashboard.</p></div><form onSubmit={submit}><div className="input-group"><label>Email Address</label><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div><div className="input-group"><label>Password</label><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></div>{error && <p className="admin-login-error" role="alert">{error}</p>}<button type="submit" className="login-btn" disabled={loading || retryAfter > 0}>{loading ? "Signing In..." : retryAfter > 0 ? `Try again in ${retryAfter}s` : "Login"}</button></form></div></div></div>;
}
