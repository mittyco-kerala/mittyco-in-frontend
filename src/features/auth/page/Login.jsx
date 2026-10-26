import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { GoogleLogin } from "@react-oauth/google";
import client, { getRetryAfterSeconds } from "../../../lib/ApiClient";
import { clearAuthSession, isPrivilegedUser, saveAuthSession } from "../authUtils";
import { isGoogleAuthConfigured } from "../googleConfig";
import { getApiErrorMessage } from "../../../lib/apiResponse";
import "./Login.css";

function Login() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");

    const [retryAfter, setRetryAfter] = useState(0);

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (retryAfter <= 0) return undefined;
        const timer = window.setInterval(() => setRetryAfter((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => window.clearInterval(timer);
    }, [retryAfter]);

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);
        setErrorMessage("");

        try {

            const response = await client.post("login/", { ...formData, login_type: "customer" });
            const user = response.data.user || response.data;
            if (isPrivilegedUser(user)) {
                clearAuthSession();
                setErrorMessage("Admin accounts must use the Super Admin login page.");
                return;
            }
            saveAuthSession(response.data);
            navigate("/", { replace: true });

        } catch (error) {
            if (error.response?.status === 429) {
                const seconds = getRetryAfterSeconds(error);
                setRetryAfter(seconds);
                setErrorMessage(`Too many attempts. Try again after ${seconds} seconds.`);
            } else if (error.response?.status === 403) {
                clearAuthSession();
                setErrorMessage(error.response?.data?.detail || "Admin accounts must use the Super Admin login page.");
            } else {
                setErrorMessage(getApiErrorMessage(error, "Invalid email or password."));
            }

        } finally {

            setLoading(false);

        }

    };

    const handleGoogleSuccess = async (credentialResponse) => {

        if (!credentialResponse?.credential) {
            setErrorMessage("Google sign-in did not return a credential. Please try again.");
            return;
        }

        setLoading(true);
        setErrorMessage("");

        try {

            const response = await client.post("google-login/", {
                token: credentialResponse.credential,
                login_type: "customer",
            });
            const user = response.data.user || response.data;
            if (isPrivilegedUser(user)) {
                clearAuthSession();
                setErrorMessage("Admin accounts must use the Super Admin login page.");
                return;
            }
            saveAuthSession(response.data);
            navigate("/", { replace: true });

        } catch (error) {
            if (error.response?.status === 429) {
                const seconds = getRetryAfterSeconds(error);
                setRetryAfter(seconds);
                setErrorMessage(`Too many attempts. Try again after ${seconds} seconds.`);
            } else if (error.response?.status === 400) {
                setErrorMessage(error.response?.data?.error || "Use a Google account with a verified email.");
            } else if (error.response?.status === 403) {
                clearAuthSession();
                setErrorMessage("This account is disabled or is not allowed for this login area.");
            } else if (error.response?.status === 503) {
                setErrorMessage("Google sign-in is not configured. Please use email and password.");
            } else {
                setErrorMessage("Google login failed.");
            }

        } finally {
            setLoading(false);
        }

    };

    const handleGoogleError = () => {

        setLoading(false);
        setErrorMessage("Google sign-in was cancelled or could not be completed. Please try again.");

    };

        return (

        <div className="login-container">

            <div className="login-wrapper">

                <div className="login-box">

                    <div className="auth-header">

                        <h1>Welcome Back</h1>

                        <p>Login to your Mittyco account to continue shopping.</p>

                        {errorMessage && <p className="admin-login-error" role="alert">{errorMessage}</p>}

                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="input-group">

                            <label>Email Address</label>

                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="input-group">

                            <label>Password</label>

                            <div className="password-group">

                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />

                                <span
                                    className="password-icon"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >

                                    {showPassword ? (
                                        <FiEyeOff />
                                    ) : (
                                        <FiEye />
                                    )}

                                </span>

                            </div>

                        </div>

                        <div className="login-options">

                            

                            <Link
                                to="/forgot-password"
                                className="forgot-link"
                            >

                                Forgot Password?

                            </Link>

                        </div>

                        <button
                            type="submit"
                            className="login-btn"
                            disabled={loading || retryAfter > 0}
                        >

                            {loading ? "Signing In..." : retryAfter > 0 ? `Try again in ${retryAfter}s` : "Login"}

                        </button>

                        <div className="divider">

                            <span>OR</span>

                        </div>

                        <div className="google-section">

                            <div className="google-btn">
                                {isGoogleAuthConfigured ? (
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                        theme="outline"
                                        text="continue_with"
                                        shape="pill"
                                        size="large"
                                    />
                                ) : (
                                    <p className="google-unavailable" role="status">
                                        Google sign-in is temporarily unavailable. Please use email and password.
                                    </p>
                                )}
                            </div>

                        </div>

                        <div className="signup-link">

                            <span>Don't have an account? </span>

                            <Link to="/signup">

                                Create Account

                            </Link>

                        </div>

                    </form>

                </div>

            </div>

        </div>
                        

    );

}

export default Login;
