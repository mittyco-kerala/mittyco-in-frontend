import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { GoogleLogin } from "@react-oauth/google";
import client from "../../../lib/ApiClient";
import { clearAuthSession, isSuperAdminUser, saveAuthSession } from "../authUtils";
import { isGoogleAuthConfigured } from "../googleConfig";
import { getPasswordPolicyError, PASSWORD_POLICY_HELP } from "../passwordPolicy";
import showToast from "../../../utils/toast";
import { getApiErrorMessage } from "../../../lib/apiResponse";
import "./SignUp.css";

function Signup() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: "",
        email: "",
        password: "",
        confirm_password: ""
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [formError, setFormError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (name === "password") {
            setPasswordError(value ? getPasswordPolicyError(value) : "");
        }
        setFormError("");
    };

    const handleSubmit = async (e) => {

        e.preventDefault();
        const nextPasswordError = getPasswordPolicyError(formData.password);
        if (nextPasswordError) {
            setPasswordError(nextPasswordError);
            showToast.error("Please meet the password requirements.");
            return;
        }

        if (formData.password !== formData.confirm_password) {
            setFormError("Passwords do not match.");
            showToast.error("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {

            const response = await client.post("register/", formData);

            alert(
                response.data.message ||
                "Registration Successful"
            );

            navigate("/login");

        } catch (error) {
            const data = error.response?.data || {};
            const backendPasswordError = data.password;
            setPasswordError(Array.isArray(backendPasswordError) ? backendPasswordError.join(" ") : backendPasswordError || "");
            
            setFormError(getApiErrorMessage(error, "Registration failed.", { exclude: ["password"] }));

        } finally {

            setLoading(false);

        }

    };

    const handleGoogleSuccess = async (credentialResponse) => {

        if (!credentialResponse?.credential) {
            setFormError("Google sign-in did not return a credential. Please try again.");
            return;
        }

        setLoading(true);
        setFormError("");

        try {

            const response = await client.post("google-login/", {
                token: credentialResponse.credential,
                login_type: "customer",
            });
            const user = response.data.user || response.data;

            saveAuthSession(response.data);

            if (isSuperAdminUser(user)) {

                navigate("/mittyco-dashboard");

            } else {

                navigate("/");

            }

        } catch (error) {

            const status = error.response?.status;
            if (status === 400) {
                setFormError(error.response?.data?.error || "Use a Google account with a verified email.");
            } else if (status === 403) {
                clearAuthSession();
                setFormError("This account is disabled or is not allowed for this login area.");
            } else if (status === 503) {
                setFormError("Google sign-in is not configured. Please use email and password.");
            } else {
                setFormError(error.response?.data?.detail || error.response?.data?.error || "Google Signup Failed");
            }

        } finally {
            setLoading(false);
        }

    };

    const handleGoogleError = () => {

        setLoading(false);
        setFormError("Google sign-in was cancelled or could not be completed. Please try again.");

    };
    return (

        <div className="signup-container">

            <div className="signup-wrapper">

                <div className="signup-box">

                    <div className="auth-header">

                        <h1>Create Account</h1>

                        <p>Create your Mittyco account and start shopping.</p>

                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="input-group">

                            <label>Full Name</label>

                            <input
                                type="text"
                                name="first_name"
                                placeholder="Enter your full name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                            />

                        </div>

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
                                    onClick={() => setShowPassword(!showPassword)}
                                >

                                    {showPassword ? <FiEyeOff /> : <FiEye />}

                                </span>

                            </div>
                            <small className="password-policy-help">{PASSWORD_POLICY_HELP}</small>
                            {passwordError && <small className="password-policy-error" role="alert">{passwordError}</small>}

                        </div>

                        <div className="input-group">

                            <label>Confirm Password</label>

                            <div className="password-group">

                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirm_password"
                                    placeholder="Confirm your password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    required
                                />

                                <span
                                    className="password-icon"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >

                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}

                                </span>

                            </div>

                        </div>

                        {formError && <p className="signup-form-error" role="alert">{formError}</p>}

                        <button
                            type="submit"
                            className="signup-btn"
                            disabled={loading}
                        >

                            {loading ? "Creating Account..." : "Sign Up"}

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
                                        width="280"
                                    />
                                ) : (
                                    <p className="google-unavailable" role="status">
                                        Google sign-in is temporarily unavailable. Please use email and password.
                                    </p>
                                )}
                            </div>

                        </div>

                    </form>

                    <div className="signup-link">

                        <span>Already have an account? </span>

                        <Link to="/login">

                            Login

                        </Link>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Signup;
