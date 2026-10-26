import { Navigate, useLocation } from "react-router-dom";
import { getAuthUser, getAuthValue, hasAuthSession, isSuperAdminUser } from "../../auth/authUtils";

export default function AdminRoute({ children }) {
    const location = useLocation();
    const adminUser = getAuthUser();
    const isSuperAdmin = isSuperAdminUser({
        ...adminUser,
        is_superuser: adminUser.is_superuser ?? getAuthValue("is_superuser"),
        role: adminUser.role || getAuthValue("role"),
    });
    if (!hasAuthSession()) return <Navigate to="/mittyco-dashboard/admin-login" state={{ from: location }} replace />;
    if (!isSuperAdmin) return <Navigate to="/mittyco-dashboard/admin-login" state={{ from: location, accessDenied: true }} replace />;
    return children;
}
