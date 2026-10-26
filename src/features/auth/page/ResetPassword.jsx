import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import client from "../../../lib/ApiClient";
import { clearAuthSession } from "../authUtils";
import { getPasswordPolicyError, PASSWORD_POLICY_HELP } from "../passwordPolicy";
import "./ResetPassword.css";

function ResetPassword() {

    const navigate = useNavigate();
    const { uidb64, token } = useParams();

    const [form, setForm] = useState({
        password: "",
        confirm_password: ""
    });

    const [loading, setLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [formError, setFormError] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value
        });
        if (name === "password") setPasswordError(value ? getPasswordPolicyError(value) : "");
        setFormError("");
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        const nextPasswordError = getPasswordPolicyError(form.password);
        if (nextPasswordError) {
            setPasswordError(nextPasswordError);
            return;
        }
        if (form.password !== form.confirm_password) {
            setFormError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {

            const response = await client.post(`reset-password/${uidb64}/${token}/`, form);

            // Password reset revokes all existing sessions on the backend.
            // Remove every in-browser auth value before sending the user back.
            clearAuthSession();
            alert(response.data.message);
            navigate("/login", { replace: true });

        } catch (error) {
            const backendPasswordError = error.response?.data?.password;
            setPasswordError(Array.isArray(backendPasswordError) ? backendPasswordError.join(" ") : backendPasswordError || "");
            setFormError(error.response?.data?.message || error.response?.data?.non_field_errors?.[0] || "Something went wrong.");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="forgot-container">

            <div className="forgot-box">

                <div className="auth-header">

                    <h1>Reset Password</h1>

                    <p>
                        Create a strong new password to secure your Mittyco account.
                    </p>

                </div>

                <form onSubmit={handleSubmit}>

                    <div className="password-group">

                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="New Password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />

                        <span
                            className="password-icon"
                            id="pa-icon"
                            onClick={() =>
                                setShowPassword(!showPassword)
                            }
                        >
                            {
                                showPassword
                                    ? <FaEyeSlash />
                                    : <FaEye />
                            }
                        </span>

                    </div>

                    <small className="password-policy-help">{PASSWORD_POLICY_HELP}</small>
                    {passwordError && <small className="password-policy-error" role="alert">{passwordError}</small>}

                    <div className="password-group">

                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirm_password"
                            placeholder="Confirm Password"
                            value={form.confirm_password}
                            onChange={handleChange}
                            required
                        />

                        <span
                            className="password-icon"
                            id="pa-icon"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                        >
                            {
                                showConfirmPassword
                                    ? <FaEyeSlash />
                                    : <FaEye />
                            }
                        </span>

                    </div>

                    {formError && <p className="reset-form-error" role="alert">{formError}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {
                            loading
                                ? "Updating..."
                                : "Reset Password"
                        }
                    </button>

                </form>

                <Link
                    to="/login"
                    className="back-login"
                >
                    Back to Login
                </Link>

            </div>

        </div>

    );

}

export default ResetPassword;
