import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../../lib/ApiClient";
import "../style/Checkout.css";
import { getImageUrl } from "../../../utils/imageUrl";
import showToast from "../../../utils/toast";
import { clearCouponApplication, isInactiveCouponError } from "../../coupon/couponState";
import DirhamAmount from "../../../components/DirhamAmount";
import { loadRazorpayCheckout } from "../../../lib/razorpay";

const Checkout = () => {

    const navigate = useNavigate();
    const ORDER_REQUEST_TIMEOUT = 35000;

    const [addresses, setAddresses] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);

    const [cartSummary, setCartSummary] = useState({
        subtotal: 0,
        shipping: 0,
        total: 0,
        discount: 0,
    });

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [checkoutError, setCheckoutError] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("RAZORPAY");

    const fetchAddresses = useCallback(async () => {

        try {

            const response = await client.get("addresses/");

            setAddresses(response.data);

            if (response.data.length > 0) {

                setSelectedAddress(response.data[0].id);

            }

        } catch (error) {

            console.log(error);

        }

    }, []);

    const fetchCart = useCallback(async () => {

        try {

            const response = await client.get("cart/", { timeout: ORDER_REQUEST_TIMEOUT });

            const cartData = response.data || {};
            const inactiveItems = (Array.isArray(cartData.items) ? cartData.items : []).filter((item) => item.coupon_status === "COUPON_INACTIVE");
            inactiveItems.forEach((item) => clearCouponApplication(item.product, item.coupon_code));

            setCartItems(cartData.items || []);

            setCartSummary({
                subtotal: Number(cartData.subtotal || 0),
                shipping: Number(cartData.shipping || 0),
                total: Number(cartData.total || 0),
                discount: Number(cartData.discount || 0),
            });

            return cartData;

        } catch (error) {

            console.log(error);
            setCheckoutError("Could not refresh your cart. Please try again.");
            return null;

        }

    }, []);

    useEffect(() => {
        const loadCheckout = async () => {
            await Promise.all([
                fetchAddresses(),
                fetchCart()
            ]);

            setLoading(false);
        };

        loadCheckout();
    }, [fetchAddresses, fetchCart]);

    const placeOrder = async () => {

        if (processing) return;

        if (!selectedAddress) {

            alert("Please select delivery address");

            return;

        }

        try {

            setProcessing(true);
            setCheckoutError("");

            const latestCart = await fetchCart();
            if (!latestCart) {
                setProcessing(false);
                return;
            }

            const inactiveItems = (Array.isArray(latestCart.items) ? latestCart.items : []).filter((item) => item.coupon_status === "COUPON_INACTIVE");
            if (inactiveItems.length) {
                inactiveItems.forEach((item) => clearCouponApplication(item.product, item.coupon_code));
                setCheckoutError("This coupon is no longer active. Your cart has been updated.");
                showToast.warning("This coupon is no longer active. Your cart has been updated.");
                setProcessing(false);
                return;
            }

            const idempotencyKey = crypto.randomUUID();

            const Razorpay = await loadRazorpayCheckout();
            const response = await client.post(
                "payment/create-razorpay-order/",
                { address: selectedAddress },
                {
                    timeout: ORDER_REQUEST_TIMEOUT,
                    headers: { "Idempotency-Key": idempotencyKey },
                },
            );
            const checkout = response.data || {};
            if (!checkout.razorpay_order_id || !checkout.key_id || !checkout.amount) {
                throw new Error("Razorpay checkout could not be started.");
            }

            await new Promise((resolve, reject) => {
                let settled = false;
                const finish = (callback, value) => {
                    if (settled) return;
                    settled = true;
                    callback(value);
                };
                const razorpay = new Razorpay({
                    key: checkout.key_id,
                    amount: checkout.amount,
                    currency: checkout.currency,
                    name: checkout.name || "Mittyco",
                    description: checkout.description || "Mittyco online order",
                    order_id: checkout.razorpay_order_id,
                    prefill: checkout.prefill,
                    theme: checkout.theme,
                    modal: { ondismiss: () => finish(reject, new Error("Payment was cancelled.")) },
                    handler: async (paymentResponse) => {
                        try {
                            const verification = await client.post(
                                "payment/verify-razorpay-payment/",
                                paymentResponse,
                                { timeout: ORDER_REQUEST_TIMEOUT },
                            );
                            finish(resolve, verification.data);
                        } catch (verificationError) {
                            finish(reject, verificationError);
                        }
                    },
                });
                razorpay.on("payment.failed", () => finish(reject, new Error("Razorpay payment failed.")));
                razorpay.open();
            });

            showToast.success("Razorpay test payment successful. Order placed.");
            setProcessing(false);
            navigate(`/payment-success?provider=razorpay&order_id=${encodeURIComponent(response.data?.razorpay_order_id || checkout.razorpay_order_id)}`);

        } catch (error) {

            console.log(error);
            if (isInactiveCouponError(error)) {
                const responseData = error.response?.data || {};
                clearCouponApplication(null, responseData.coupon_code);
                setCheckoutError("This coupon is no longer active. Your cart has been updated.");
                showToast.warning("This coupon is no longer active. Your cart has been updated.");
                await fetchCart();
            } else {
                setCheckoutError("Unable to place the order. Please try again.");
            }

            setProcessing(false);

        }

    };

    if (loading) {

        return (

            <div className="checkout-loading">

                Loading...

            </div>

        );

    }
        return (

        <div className="mittyco-checkout">

            <div className="mittyco-checkout-header">

                <h1 className="mittyco-checkout-title">

                    Checkout

                </h1>

                <p className="mittyco-checkout-subtitle">

                    Pay securely online using Razorpay test mode.

                </p>

                {checkoutError && <p className="coupon-inactive-warning" role="alert">{checkoutError}</p>}

            </div>

            <div className="mittyco-checkout-wrapper">

                <div className="mittyco-checkout-left">

                    <div className="mittyco-checkout-card">

                        <div className="mittyco-card-header">

                            <h2>

                                Delivery Address

                            </h2>

                            <button
                                className="mittyco-add-address-btn"
                                onClick={() => navigate("/profile")}
                            >

                                + Add Address

                            </button>

                        </div>

                        {

                            addresses.length === 0 ?

                                <div className="mittyco-empty-box">

                                    <p>

                                        No address found

                                    </p>

                                </div>

                                :

                                addresses.map((address) => (

                                    <div
                                        key={address.id}
                                        className={`mittyco-address-card ${
                                            selectedAddress === address.id
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setSelectedAddress(address.id)
                                        }
                                    >

                                        <input
                                            type="radio"
                                            checked={
                                                selectedAddress === address.id
                                            }
                                            onChange={() =>
                                                setSelectedAddress(address.id)
                                            }
                                        />

                                        <div className="mittyco-address-info">

                                            <h4>

                                                {address.full_name}

                                            </h4>

                                            <p>

                                                {address.phone}

                                            </p>

                                            <p>

                                                {address.address_line}

                                            </p>

                                            <p>

                                                {address.city},{" "}
                                                {address.postal_code}

                                            </p>

                                            <p>

                                                {address.country}

                                            </p>

                                        </div>

                                    </div>

                                ))

                        }

                    </div>

                    <div className="mittyco-checkout-card">

                        <h2>

                            Order Method

                        </h2>

                        <div className="mittyco-payment-card">

                            <div className="mittyco-payment-title">

                            Choose how to place your order

                            </div>

                            <p>

                                Pay securely with Razorpay. Test mode is currently enabled.

                            </p>

                            <label className={`mittyco-payment-option ${paymentMethod === "RAZORPAY" ? "active" : ""}`}>
                                <input
                                    type="radio"
                                    name="payment-method"
                                    value="RAZORPAY"
                                    checked={paymentMethod === "RAZORPAY"}
                                    onChange={() => setPaymentMethod("RAZORPAY")}
                                />
                                <span>
                                    <strong>Pay online with Razorpay</strong>
                                    <small>Test mode only — no real money is charged.</small>
                                </span>
                            </label>

                        </div>

                    </div>

                </div>

                <div className="mittyco-checkout-right">

                    <div className="mittyco-checkout-card">

                        <h2>

                            Order Summary

                        </h2>

                        {

                            cartItems.length === 0 ?

                                <div className="mittyco-empty-box">

                                    <p>

                                        Your cart is empty

                                    </p>

                                </div>

                                :

                                cartItems.map((item) => (

                                    <div
                                        key={item.id}
                                        className="mittyco-summary-item"
                                    >

                                        <div className="mittyco-summary-image">

                                            <img
                                                src={getImageUrl(item.product_image)}
                                                alt={item.product_name}
                                            />

                                        </div>

                                        <div className="mittyco-summary-details">

                                            <h4>

                                                {item.product_name}

                                            </h4>

                                            {item.variant_size !== null && (
                                                <p>

                                                    {item.unit_type || "Variant Option"} : {item.size}

                                                </p>
                                            )}

                                            <p>

                                                Color : {item.color}

                                            </p>

                                            {item.coupon_status === "COUPON_INACTIVE" && (
                                                <p className="coupon-inactive-warning" role="alert">
                                                    This coupon is no longer active.
                                                </p>
                                            )}

                                            <p>

                                                Qty : {item.quantity}

                                            </p>

                                        </div>

                                        <div className="mittyco-summary-price">

                                            <DirhamAmount value={Number(item.total_price)} />

                                        </div>

                                    </div>

                                ))

                        }

                        <div className="mittyco-summary-total">
                                                        <div className="mittyco-summary-row">

                                <span>

                                    Subtotal

                                </span>

                                <span>

                                            <DirhamAmount value={cartSummary.subtotal} />

                                </span>

                            </div>

                            {/* <div className="mittyco-summary-row">

                                <span>

                                    Offer Discount

                                </span>

                                <span
                                    style={{
                                        color: "#1d9d55",
                                        fontWeight: "600",
                                    }}
                                >

                                    <DirhamAmount value={-cartSummary.discount} />

                                </span>

                            </div> */}

                            <div className="mittyco-summary-row">

                                <span>

                                    Shipping

                                </span>

                                <span>

                                    {
                                        cartSummary.shipping === 0
                                            ? "FREE"
                                            : <DirhamAmount value={cartSummary.shipping} />
                                    }

                                </span>

                            </div>

                            <div className="mittyco-summary-row">

                                <span>

                                    Tax

                                </span>

                                <span>

                                    Included

                                </span>

                            </div>

                            <div className="mittyco-summary-divider"></div>

                            <div className="mittyco-grand-total">

                                <div>

                                    <h3>

                                        Total

                                    </h3>

                                </div>

                                <h2>

                                            <DirhamAmount value={cartSummary.total} />

                                </h2>

                            </div>

                        </div>

                        <button
                            className="mittyco-checkout-btn"
                            onClick={placeOrder}
                            disabled={processing || cartItems.length === 0}
                        >

                            {

                                processing

                                    ?

                                    "Placing order..."

                                    :

                                    "Pay with Razorpay (Test)"

                            }

                        </button>

                        <p className="mittyco-payment-note">

                            Use Razorpay test credentials to complete a simulated payment.

                        </p>

                    </div>

                </div>

            </div>

        </div>

    );

};

export default Checkout;
