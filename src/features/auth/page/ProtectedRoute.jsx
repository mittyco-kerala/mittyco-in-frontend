import { Navigate } from "react-router-dom";
import { hasAuthSession } from "../authUtils";

const ProtectedRoute=({children})=>{
    return hasAuthSession() ? children : <Navigate to="/login" replace/>;
};

export default ProtectedRoute;
