import React, { useEffect, useRef, useState } from "react";
import "../style/Cart.css";
import { AiOutlineDoubleRight } from "react-icons/ai";
import Cart_query from "../queries/Cart_query";
import { RemoveCart, saveQuantity } from "../api/Cart_api";
import { Link, useNavigate } from "react-router-dom";
import showToast from "../../../utils/toast";
import { getImageUrl } from "../../../utils/imageUrl";
import { clearCouponApplication, isInactiveCouponError } from "../../coupon/couponState";
import DirhamAmount from "../../../components/DirhamAmount";

function Cart_page() {

    const navigate = useNavigate();

    const {
        data,
        isLoading,
        error,
        refetch
    } = Cart_query();

    const [cartItems, setCartItems] = useState([]);

    const timers = useRef({});
    const inactiveCouponsNotified = useRef(new Set());

    useEffect(() => {

        if (data?.items) {

            const nextItems = (Array.isArray(data.items) ? data.items : []).map(item => ({

        id: item.id,

        product: item.product,

        variant: item.variant,

        variant_size: item.variant_size,

        name: item.product_name || "Unknown Product",

        image: item.product_image || "",

        color: item.color || "",

        size: item.size || "",

        unit_type: item.unit_type || "",

        price: Number(item.discounted_price ?? item.original_price ?? 0),
        discountedPrice: Number(item.discounted_price ?? item.original_price ?? 0),

        originalPrice: Number(item.original_price || 0),

        discount: Number(item.discount_amount || 0),

        totalPrice: Number(item.total_price ?? 0),

        couponCode: item.coupon_code || "",

        couponStatus: item.coupon_status || "",

        quantity: item.quantity || 1,

        stock: item.stock || 0
    }));

            nextItems.filter((item) => item.couponStatus === "COUPON_INACTIVE").forEach((item) => {
                clearCouponApplication(item.product, item.couponCode);
                const notificationKey = `${item.product}:${item.couponCode}`;
                if (!inactiveCouponsNotified.current.has(notificationKey)) {
                    inactiveCouponsNotified.current.add(notificationKey);
                    showToast.warning("This coupon is no longer active.");
                }
            });
            setCartItems(nextItems);

        }

    }, [data]);

    const updateQuantity = (id, quantity) => {

        setCartItems(prev =>
            prev.map(item => {

                if (item.id !== id)
                    return item;

                clearTimeout(
                    timers.current[id]
                );

                timers.current[id] = setTimeout(async () => {

                    try {

                        await saveQuantity(
                            id,
                            quantity
                        );

                        await refetch();

                    } catch (err) {
                        if (isInactiveCouponError(err)) {
                            const item = cartItems.find((cartItem) => cartItem.id === id);
                            clearCouponApplication(item?.product, item?.couponCode);
                            showToast.warning("This coupon is no longer active.");
                        }
                        console.log(err);

                    }

                }, 500);

                return {
                    ...item,
                    quantity
                };

            })
        );

    };

    const increaseQuantity = (id) => {

        const item = cartItems.find(
            item => item.id === id
        );

        if (!item) {
            return;
        }

        if (item.quantity >= item.stock) {

            showToast.error(
                `Only ${item.stock} item${item.stock > 1 ? "s" : ""} available in stock`
            );

            return;
        }

        const newQuantity = item.quantity + 1;

        setCartItems(prev =>
            prev.map(cart =>
                cart.id === id
                    ? {
                        ...cart,
                        quantity: newQuantity
                    }
                    : cart
            )
        );

        clearTimeout(timers.current[id]);

        timers.current[id] = setTimeout(async () => {

            try {

                await saveQuantity(
                    id,
                    newQuantity
                );

                await refetch();

            } catch (error) {

                if (isInactiveCouponError(error)) {
                    const latestItem = cartItems.find((cartItem) => cartItem.id === id);
                    clearCouponApplication(latestItem?.product, latestItem?.couponCode);
                    showToast.warning("This coupon is no longer active.");
                }

                showToast.error(
                    "Failed to update quantity"
                );

                console.log(error);

            }

        }, 500);

    };

    const decreaseQuantity = (id) => {

        const item = cartItems.find(
            i => i.id === id
        );

        if (!item)
            return;

        updateQuantity(
            id,
            Math.max(
                1,
                item.quantity - 1
            )
        );

    };

    const removeItem = async (id) => {

        try {

            await RemoveCart(id);

            showToast.success(
                "Item removed from cart"
            );

            await refetch();

        } catch (err) {

            console.log(err);

        }

    };

    const subtotal =
        Number(data?.subtotal || 0);

    const shipping =
        Number(data?.shipping || 0);

    const total =
        Number(data?.total || 0);

    if (isLoading)
        return <p>Loading...</p>;

    if (error)
        return <p>Something went wrong</p>;

    return (
        <div className="checkout-page">

            <div
                className="toshop"
                style={{
                    paddingLeft: "10px"
                }}
            >
                <Link to="/shop">
                    Shop
                </Link>

                <AiOutlineDoubleRight />
            </div>

            <div className="checkout-container">

                <aside className="order-summary">

                    <h2>
                        Cart Items
                    </h2>

                    {
                        cartItems.length > 0
                            ? (

                                cartItems.map(cart => (

                                    <div
                                        className="product"
                                        key={cart.id}
                                    >

                                        <img

                                            src={getImageUrl(cart.image)}

                                            alt={cart.name}

                                            onClick={() =>
                                                navigate(
                                                    `/single/${cart.product}`,
                                                    {
                                                        state: {
                                                            variantId: cart.variant,
                                                            sizeId: cart.variant_size
                                                        }
                                                    }
                                                )
                                            }

                                        />

                                        <div className="product-details">

                                            <h4>
                                                {cart.name}
                                            </h4>

                                            {cart.couponStatus === "COUPON_INACTIVE" && (
                                                <p className="coupon-inactive-warning" role="alert">
                                                    This coupon is no longer active.
                                                </p>
                                            )}

                                            <p>
                                                Color : {cart.color}
                                            </p>

                                            {cart.variant_size !== null && (
                                                <p>
                                                    {cart.unit_type || "Variant Option"} : {cart.size}
                                                </p>
                                            )}

                                            <div className="quantity-box">

                                                <button
                                                    onClick={() =>
                                                        decreaseQuantity(cart.id)
                                                    }
                                                >
                                                    -
                                                </button>

                                                <span>
                                                    {cart.quantity}
                                                </span>

                                                <button
                                                    onClick={() =>
                                                        increaseQuantity(cart.id)
                                                    }
                                                >
                                                    +
                                                </button>

                                            </div>

                                            <button

                                                className="cart_remove-btn"

                                                onClick={() =>
                                                    removeItem(cart.id)
                                                }

                                            >
                                                Remove
                                            </button>

                                        </div>

                                        <div className="cart-price">

                                            {
                                                cart.originalPrice >
                                                cart.price && (

                                                    <del>
                                                        <DirhamAmount value={cart.originalPrice * cart.quantity} />

                                                    </del>

                                                )
                                            }

                                            <h5>
                                                <DirhamAmount value={cart.totalPrice} />

                                            </h5>

                                        </div>

                                    </div>

                                ))

                            )

                            : (

                                <p>
                                    Cart is empty
                                </p>

                            )
                    }

                </aside>

                <div className="checkout-right">

                    <div className="sticky-summary">

                        <div className="Checkout_card">

                            <div className="price-row">

                                <span>
                                    Subtotal
                                </span>

                                <span>
                                    <DirhamAmount value={subtotal} />
                                </span>

                            </div>

                            <div className="price-row">

                                <span>
                                    Shipping
                                </span>

                                <span>
                                    <DirhamAmount value={shipping} />
                                </span>

                            </div>

                            <div className="total-row">

                                <span>
                                    Total
                                </span>

                                <span>
                                    <DirhamAmount value={total} />
                                </span>

                            </div>

                            <button

                                className="continue-btn"

                                disabled={
                                    cartItems.length === 0
                                }

                                onClick={() =>
                                    navigate("/checkoutpage")
                                }

                            >
                                Proceed to Checkout

                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Cart_page;
