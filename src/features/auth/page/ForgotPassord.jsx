import { useState } from "react";
import { Link } from "react-router-dom";
import client from "../../../lib/ApiClient";
import { getApiErrorMessage } from "../../../lib/apiResponse";
import "./Forgotpassword.css";

function ForgotPassword() {

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const neutralMessage = "If the account exists, a reset email will be sent.";

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);
        setMessage("");
        setErrorMessage("");

        try {

            const response = await client.post("forgot-password/", {
                email: email.trim(),
            });

            setMessage(response.data?.message || neutralMessage);
            setEmail("");

        } catch (error) {

            if (error.response?.status === 400) {
                setErrorMessage(getApiErrorMessage(error, "Enter a valid email address."));
            } else {
                setErrorMessage("We could not process that request right now. Please try again.");
            }

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="forgot-container">

            <div className="forgot-box">

                <div className="auth-header">

                    <h1>Forgot Password?</h1>

                    <p>
                        Don't worry! It happens. Enter your registered email
                        address and we'll send you a password reset link.
                    </p>

                </div>

                <form onSubmit={handleSubmit}>

                    <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <button type="submit">

                        {loading ? "Sending..." : "Send Reset Link"}

                    </button>

                    {message && <p className="password-reset-success" role="status">{message}</p>}
                    {errorMessage && <p className="password-reset-error" role="alert">{errorMessage}</p>}

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

export default ForgotPassword;
