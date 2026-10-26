import { Link } from "react-router-dom";

export default function Unauthorized() {
    return <main className="unauthorized-page"><div className="unauthorized-card"><span className="unauthorized-mark">!</span><p className="eyebrow">Access restricted</p><h1>Super Admin access required</h1><p>This area is reserved for Super Admin accounts. Please sign in with the correct account to continue.</p><Link to="/mittyco-dashboard/admin-login" className="primary-button">Super Admin login</Link></div></main>;
}
