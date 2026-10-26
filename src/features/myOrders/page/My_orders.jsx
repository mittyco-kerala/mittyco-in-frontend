import React, { useEffect, useState } from "react";
import client from "../../../lib/ApiClient";
import "../styles/Myorders.css";
import { getImageUrl } from "../../../utils/imageUrl";
import DirhamAmount from "../../../components/DirhamAmount";

const MyOrders = () => {

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        fetchOrders();

    }, []);

    const fetchOrders = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await client.get(
                "/my-orders/"
            );

            setOrders(
                response.data
            );

        } catch (error) {

            console.error(
                "Failed to load orders:",
                error
            );

            setError(
                "Unable to load your orders."
            );

        } finally {

            setLoading(false);

        }

    };


    const getStatusClass = (status) => {

        switch (status?.toLowerCase()) {

            case "pending":
                return "pending";

            case "confirmed":
                return "confirmed";

            case "processing":
                return "processing";

            case "shipped":
                return "shipped";

            case "delivered":
                return "delivered";

            case "cancelled":
                return "cancelled";

            default:
                return "default";

        }

    };


    const formatDate = (date) => {

        if (!date) return "—";

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };


    const getItemCount = (items = []) => {

        return items.reduce(
            (total, item) =>
                total + Number(item.quantity || 1),
            0
        );

    };


    if (loading) {

        return (

            <main className="orders-page">

                <div className="orders-state">

                    <div className="orders-loader"></div>

                    <p>
                        Loading your orders...
                    </p>

                </div>

            </main>

        );

    }


    if (error) {

        return (

            <main className="orders-page">

                <div className="orders-state orders-error">

                    <h2>
                        We couldn't load your orders
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={fetchOrders}
                    >
                        Try Again
                    </button>

                </div>

            </main>

        );

    }


    if (!orders.length) {

        return (

            <main className="orders-page">

                <div className="orders-empty">

                    <div className="orders-empty-icon">
                        ♡
                    </div>

                    <h1>
                        No orders yet
                    </h1>

                    <p>
                        Your purchases will appear here
                        once you place your first order.
                    </p>

                </div>

            </main>

        );

    }
        return (

        <main className="orders-page">

            <div className="orders-container">

                <header className="orders-header">

                    <div>

                        <span className="orders-eyebrow">
                            PURCHASE HISTORY
                        </span>

                        <h1>
                            My Orders
                        </h1>

                        <p>
                            View and track your purchases.
                        </p>

                    </div>

                    <div className="orders-count">

                        <strong>
                            {orders.length}
                        </strong>

                        <span>
                            {orders.length === 1
                                ? "Order"
                                : "Orders"
                            }
                        </span>

                    </div>

                </header>


                <div className="orders-list">

                    {orders.map((order) => (

                        <article
                            className="order-card"
                            key={order.id}
                        >

                            <div className="order-card-header">

                                <div className="order-reference">

                                    <span className="order-number">
                                        Order #{order.id}
                                    </span>

                                    <span className="order-separator">
                                        •
                                    </span>

                                    <span className="order-date">
                                        {formatDate(order.created_at)}
                                    </span>

                                </div>


                                <span
                                    className={`order-status ${getStatusClass(order.status)}`}
                                >
                                    {order.status}
                                </span>

                            </div>


                            <div className="order-products">

                                {order.items?.map((item) => (

                                    <div
                                        className="order-product"
                                        key={item.id}
                                    >

                                        <div className="order-product-image">

                                            <img
                                                src={
                                                    item.product_image
                                                        ? getImageUrl(
                                                            item.product_image
                                                        )
                                                        : "/images/no-image.png"
                                                }
                                                alt={
                                                    item.product_name ||
                                                    "Product"
                                                }
                                            />

                                        </div>


                                        <div className="order-product-info">

                                            <h2>
                                                {item.product_name}
                                            </h2>


                                            <div className="order-product-meta">

                                                {item.color && (

                                                    <span>
                                                        {item.color}
                                                    </span>

                                                )}

                                                {item.size && (

                                                    <>

                                                        {item.color && (
                                                            <i>•</i>
                                                        )}

                                                        <span>
                                                            {item.unit_type ? `${item.unit_type}: ${item.size}` : item.size}
                                                        </span>

                                                    </>

                                                )}

                                            </div>


                                            <div className="order-product-quantity">

                                                <span>
                                                    Qty
                                                </span>

                                                <strong>
                                                    {item.quantity || 1}
                                                </strong>

                                            </div>

                                        </div>

                                    </div>

                                ))}

                            </div>


                            <footer className="order-card-footer">

                                <div className="order-items-total">

                                    {getItemCount(order.items)}

                                    {" "}

                                    {getItemCount(order.items) === 1
                                        ? "item"
                                        : "items"
                                    }

                                </div>


                                <div className="order-total">

                                    <span>
                                        Order Total
                                    </span>

                                    <strong>
                                        <DirhamAmount value={order.total_amount || 0} />
                                    </strong>

                                </div>

                            </footer>

                        </article>

                    ))}

                </div>

            </div>

        </main>

    );

};

export default MyOrders;
