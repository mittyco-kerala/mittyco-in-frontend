const AUTH_SESSION_KEYS = ["access", "refresh", "access_token", "refresh_token", "authenticated", "admin_user", "user_id", "email", "first_name", "is_staff", "is_superuser", "role", "permissions"];

function sessionStore() {
    return typeof window === "undefined" ? null : window.sessionStorage;
}

function localStore() {
    return typeof window === "undefined" ? null : window.localStorage;
}

function setSessionValue(key, value) {
    const storage = sessionStore();
    if (!storage) return;
    if (value === undefined || value === null || value === "") storage.removeItem(key);
    else storage.setItem(key, String(value));
}

export function getAuthValue(key) {
    return sessionStore()?.getItem(key) || "";
}

export function hasAuthSession() {
    return getAuthValue("authenticated") === "true";
}

export function getAuthUser() {
    try {
        return JSON.parse(getAuthValue("admin_user") || "{}");
    } catch {
        return {};
    }
}

export function isSuperAdminUser(user = {}) {
    const role = String(user.role || user.user_role || user.user_type || user.role_name || "").trim().toLowerCase().replace(/[_-]/g, " ");
    return role === "super admin" || role === "superadmin";
}

export function isPrivilegedUser(user = {}) {
    const role = String(user.role || user.user_role || user.user_type || user.role_name || "").trim().toLowerCase().replace(/[_-]/g, " ");
    return isSuperAdminUser(user) || role.includes("admin") || role === "staff" || user.is_staff === true || user.is_superuser === true;
}

export function saveAuthUser(user = {}) {
    const userId = user.id ?? user.user_id ?? user.pk;
    setSessionValue("user_id", userId);
    setSessionValue("email", user.email || "");
    setSessionValue("first_name", user.first_name || "");
    setSessionValue("is_staff", Boolean(user.is_staff));
    setSessionValue("is_superuser", isSuperAdminUser(user));
    setSessionValue("role", user.role || user.user_role || user.user_type || user.role_name || "");
    setSessionValue("permissions", JSON.stringify(user.permissions || {}));
}

export function saveAuthTokens(data = {}) {
    const tokenData = data?.tokens || data;
    const access = tokenData?.access ?? tokenData?.access_token;
    const refresh = tokenData?.refresh ?? tokenData?.refresh_token;
    if (access !== undefined) setSessionValue("access", access);
    if (refresh !== undefined) setSessionValue("refresh", refresh);
}

export function saveAuthSession(data = {}) {
    const user = data.user || data;
    clearAuthSession();
    setSessionValue("authenticated", "true");
    setSessionValue("admin_user", JSON.stringify(user));
    saveAuthUser(user);
    saveAuthTokens(data);
    return user;
}

export function clearAuthSession() {
    // Remove legacy localStorage values during the migration to per-tab sessions.
    [sessionStore(), localStore()].filter(Boolean).forEach((storage) => {
        AUTH_SESSION_KEYS.forEach((key) => storage.removeItem(key));
    });
}
