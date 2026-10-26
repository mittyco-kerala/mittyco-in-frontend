import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../../lib/ApiClient";
import "../style/Checkout.css";
import { getImageUrl } from "../../../utils/imageUrl";
import showToast from "../../../utils/toast";
import { clearCouponApplication, isInactiveCouponError } from "../../coupon/couponState";
import DirhamAmount from "../../../components/DirhamAmount";
import { WHATSAPP_NUMBER } from "../../../config/contact";

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
    const [paymentMethod, setPaymentMethod] = useState("COD");

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

    const buildWhatsAppMessage = (orderId, address, items, total) => {
        const itemLines = items.map((item) => {
            const variant = item.variant_size !== null && item.size
                ? `, ${item.unit_type || "Option"}: ${item.size}`
                : "";
            return `- ${item.product_name}${variant} x ${item.quantity}`;
        });

        return [
            "Hello Mittyco Team,",
            "",
            `I placed an order via WhatsApp. Order: ORD-${String(orderId).padStart(6, "0")}`,
            "",
            "Items:",
            ...itemLines,
            "",
            `Total: ₹${Number(total || 0).toFixed(2)}`,
            "",
            "Delivery address:",
            address.full_name,
            address.phone,
            address.address_line,
            `${address.city}, ${address.postal_code}`,
            address.country,
        ].join("\n");
    };

    const placeOrder = async () => {

        if (processing) return;

        if (!selectedAddress) {

            alert("Please select delivery address");

            return;

        }

        const whatsappWindow = paymentMethod === "WHATSAPP"
            ? window.open("about:blank", "_blank")
            : null;

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

            // A failed checkout attempt must never reuse a key: each button
            // click represents a new user-initiated checkout operation.
            const idempotencyKey = crypto.randomUUID();
            const response = await client.post(
                "place-order/",
                {
                    address: selectedAddress,
                    payment_method: paymentMethod,
                },
                {
                    timeout: ORDER_REQUEST_TIMEOUT,
                    headers: { "Idempotency-Key": idempotencyKey }
                }
            );

            const orderId = response.data?.order_id;
            if (!orderId) {
                throw new Error("The order could not be created.");
            }

            if (paymentMethod === "WHATSAPP") {
                const selectedAddressDetails = addresses.find((address) => address.id === selectedAddress);
                const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    buildWhatsAppMessage(orderId, selectedAddressDetails, cartItems, response.data?.grand_total || cartSummary.total)
                )}`;

                if (whatsappWindow && !whatsappWindow.closed) {
                    whatsappWindow.location.href = whatsappUrl;
                    whatsappWindow.opener = null;
                } else {
                    window.location.href = whatsappUrl;
                    return;
                }

                showToast.success("Order placed. WhatsApp is ready with your order details.");
            } else {
                showToast.success("COD order placed successfully.");
            }

            navigate("/myorders");

        } catch (error) {

            if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.close();
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

        <div className="eehook-checkout">

            <div className="eehook-checkout-header">

                <h1 className="eehook-checkout-title">

                    Checkout

                </h1>

                <p className="eehook-checkout-subtitle">

                    Choose Cash on Delivery or send your order through WhatsApp.

                </p>

                {checkoutError && <p className="coupon-inactive-warning" role="alert">{checkoutError}</p>}

            </div>

            <div className="eehook-checkout-wrapper">

                <div className="eehook-checkout-left">

                    <div className="eehook-checkout-card">

                        <div className="eehook-card-header">

                            <h2>

                                Delivery Address

                            </h2>

                            <button
                                className="eehook-add-address-btn"
                                onClick={() => navigate("/profile")}
                            >

                                + Add Address

                            </button>

                        </div>

                        {

                            addresses.length === 0 ?

                                <div className="eehook-empty-box">

                                    <p>

                                        No address found

                                    </p>

                                </div>

                                :

                                addresses.map((address) => (

                                    <div
                                        key={address.id}
                                        className={`eehook-address-card ${
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

                                        <div className="eehook-address-info">

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

                    <div className="eehook-checkout-card">

                        <h2>

                            Order Method

                        </h2>

                        <div className="eehook-payment-card">

                            <div className="eehook-payment-title">

                            Choose how to place your order

                            </div>

                            <p>

                                Online payments are temporarily unavailable. Choose Cash on Delivery or continue through WhatsApp.

                            </p>

                            <label className={`eehook-payment-option ${paymentMethod === "COD" ? "active" : ""}`}>
                                <input
                                    type="radio"
                                    name="payment-method"
                                    value="COD"
                                    checked={paymentMethod === "COD"}
                                    onChange={() => setPaymentMethod("COD")}
                                />
                                <span>
                                    <strong>Cash on Delivery (COD)</strong>
                                    <small>Pay in cash when your order is delivered.</small>
                                </span>
                            </label>

                            <label className={`eehook-payment-option ${paymentMethod === "WHATSAPP" ? "active" : ""}`}>
                                <input
                                    type="radio"
                                    name="payment-method"
                                    value="WHATSAPP"
                                    checked={paymentMethod === "WHATSAPP"}
                                    onChange={() => setPaymentMethod("WHATSAPP")}
                                />
                                <span>
                                    <strong>Order through WhatsApp</strong>
                                    <small>Open WhatsApp with your order details ready to send.</small>
                                </span>
                            </label>

                        </div>

                    </div>

                </div>

                <div className="eehook-checkout-right">

                    <div className="eehook-checkout-card">

                        <h2>

                            Order Summary

                        </h2>

                        {

                            cartItems.length === 0 ?

                                <div className="eehook-empty-box">

                                    <p>

                                        Your cart is empty

                                    </p>

                                </div>

                                :

                                cartItems.map((item) => (

                                    <div
                                        key={item.id}
                                        className="eehook-summary-item"
                                    >

                                        <div className="eehook-summary-image">

                                            <img
                                                src={getImageUrl(item.product_image)}
                                                alt={item.product_name}
                                            />

                                        </div>

                                        <div className="eehook-summary-details">

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

                                        <div className="eehook-summary-price">

                                            <DirhamAmount value={Number(item.total_price)} />

                                        </div>

                                    </div>

                                ))

                        }

                        <div className="eehook-summary-total">
                                                        <div className="eehook-summary-row">

                                <span>

                                    Subtotal

                                </span>

                                <span>

                                            <DirhamAmount value={cartSummary.subtotal} />

                                </span>

                            </div>

                            {/* <div className="eehook-summary-row">

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

                            <div className="eehook-summary-row">

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

                            <div className="eehook-summary-row">

                                <span>

                                    Tax

                                </span>

                                <span>

                                    Included

                                </span>

                            </div>

                            <div className="eehook-summary-divider"></div>

                            <div className="eehook-grand-total">

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
                            className="eehook-checkout-btn"
                            onClick={placeOrder}
                            disabled={processing || cartItems.length === 0}
                        >

                            {

                                processing

                                    ?

                                    "Placing order..."

                                    :

                                    paymentMethod === "WHATSAPP" ? "Continue via WhatsApp" : "Place COD Order"

                            }

                        </button>

                        <p className="eehook-payment-note">

                            {paymentMethod === "WHATSAPP"
                                ? "Your order details will open in WhatsApp for confirmation."
                                : "Payment will be collected in cash when your order is delivered."}

                        </p>

                    </div>

                </div>

            </div>

        </div>

    );

};

export default Checkout;
