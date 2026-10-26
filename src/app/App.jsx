import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import './../App.css';
import client from "../lib/ApiClient";
import { clearAuthSession, saveAuthSession } from "../features/auth/authUtils";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Router from './Router';
import ScrollToTop from '../components/ScrollToTop';

function App() {

    const location = useLocation();
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        let active = true;
        // Session restoration must never make the public storefront depend on
        // an available API connection. A cold EC2/proxy or a CORS outage
        // should show the public app after a short bounded wait.
        client.get("auth/session/", {
            skipAuthRefresh: true,
            skipAuthRedirect: true,
            timeout: 5000,
        })
            .then((response) => {
                if (active) saveAuthSession(response.data);
            })
            .catch((error) => {
                if (error.response?.status === 401) clearAuthSession();
            })
            .finally(() => {
                if (active) setAuthReady(true);
            });
        return () => { active = false; };
    }, []);

    if (!authReady) return <div aria-live="polite" aria-label="Loading application" className="app-loading"><div className="app-loading-card" aria-hidden="true"><span className="skeleton app-loading-logo" /><span className="skeleton app-loading-line wide" /><span className="skeleton app-loading-line" /></div></div>;

    const normalizedPath = location.pathname.toLowerCase();
    const isAdminPage = normalizedPath.startsWith("/mittyco-dashboard") || normalizedPath.startsWith("/orderdashboard") || normalizedPath.startsWith("/order-dashboard");

    return (
        <>
            <ScrollToTop />

            {!isAdminPage && <Navbar />}

            <div style={{ minHeight: 'calc(100vh - 64px)' }}>
                <Router />
            </div>

            {!isAdminPage && <Footer />}
        </>
    );
}

export default App;
