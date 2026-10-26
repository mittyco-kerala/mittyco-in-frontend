import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import client from "../../../lib/ApiClient";
import { getOrderId, getPaymentFailure, PAYMENT_MESSAGES } from "../paymentResult";
import "../style/PaymentSuccess.css";

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [orderId, setOrderId] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [failure, setFailure] = useState(null);

    useEffect(() => {
        let cancelled = false;
        let redirectTimer;

        const showFailure = (nextFailure) => {
            if (cancelled) return;
            setFailure(nextFailure);
            setMessage(nextFailure.message);
            setPaymentSuccess(false);
            setLoading(false);

            if (nextFailure.returnToOrders) {
                redirectTimer = window.setTimeout(() => navigate("/myorders", { replace: true }), 2500);
            }
        };

        const verifyPayment = async () => {
            const cashfreeOrderId = searchParams.get("order_id");

            if (!cashfreeOrderId) {
                showFailure({ message: PAYMENT_MESSAGES.invalidSession, title: "Payment Not Completed" });
                return;
            }

            try {
                const response = await client.get("payment/cashfree-success/", {
                    params: { order_id: cashfreeOrderId },
                });

                if (response.status !== 200) {
                    showFailure({ message: PAYMENT_MESSAGES.generic, title: "Payment Not Confirmed" });
                    return;
                }

                if (cancelled) return;

                // This is the only path that updates the cart cache. Failed,
                // refunded, or stale sessions deliberately leave cart items intact.
                queryClient.setQueryData(["cartProduct"], (currentCart) => ({
                    ...(currentCart || {}),
                    items: [],
                    subtotal: 0,
                    shipping: 0,
                    discount: 0,
                    total: 0,
                }));

                setOrderId(getOrderId(response.data));
                setMessage(response.data?.message || "Your payment has been successfully verified.");
                setPaymentSuccess(true);
                setLoading(false);
            } catch (error) {
                showFailure(getPaymentFailure(error));
            }
        };

        verifyPayment();

        return () => {
            cancelled = true;
            if (redirectTimer) window.clearTimeout(redirectTimer);
        };
    }, [navigate, queryClient, searchParams]);

    const title = paymentSuccess ? "Payment Confirmed" : failure?.title || "Payment Not Confirmed";

    return (
        <div className={`payment-success-page ${!loading && !paymentSuccess ? "payment-failed-page" : ""}`}>
            <div className={`payment-success-card ${!loading && !paymentSuccess ? "payment-failed-card" : ""}`}>
                {loading ? (
                    <>
                        <div className="payment-loader"><span /></div>
                        <h2 className="payment-title">Verifying Your Payment</h2>
                        <p className="payment-subtitle">We're securely confirming your payment. This usually takes only a few seconds.</p>
                    </>
                ) : paymentSuccess ? (
                    <>
                        <div className="success-icon" aria-hidden="true">
                            <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
                                <circle className="success-circle" cx="26" cy="26" r="25" fill="none" />
                                <path className="success-check" fill="none" d="M14 27l7 7 17-17" />
                            </svg>
                        </div>
                        <h2 className="payment-title">{title}</h2>
                        <p className="payment-subtitle">Thank you for shopping with us. Your payment has been successfully verified.</p>
                        <div className="payment-message">{message}</div>
                        <div className="payment-info">
                            <div className="info-row"><span>Status</span><strong>Confirmed</strong></div>
                            <div className="info-row"><span>Order ID</span><strong>{orderId || "Available in My Orders"}</strong></div>
                            <div className="info-row"><span>Next Step</span><strong>Preparing Shipment</strong></div>
                        </div>
                        <button className="orders-btn" onClick={() => navigate("/myorders")}>View My Orders</button>
                        <Link to="/shop" className="continue-shopping">Continue Shopping</Link>
                    </>
                ) : (
                    <>
                        <div className="failed-icon" aria-hidden="true">
                            <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="26" cy="26" r="24" fill="none" />
                                <path d="M18 18L34 34" fill="none" />
                                <path d="M34 18L18 34" fill="none" />
                            </svg>
                        </div>
                        <h2 className="payment-title">{title}</h2>
                        <p className="payment-subtitle">We couldn't confirm this payment.</p>
                        <div className="payment-error-message" role="alert">{message}</div>
                        {failure?.returnToOrders ? (
                            <button className="orders-btn" onClick={() => navigate("/myorders", { replace: true })}>View My Orders</button>
                        ) : (
                            <Link className="retry-payment-btn" to="/checkout">Return to Cart</Link>
                        )}
                        <Link to="/shop" className="continue-shopping">Continue Shopping</Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
