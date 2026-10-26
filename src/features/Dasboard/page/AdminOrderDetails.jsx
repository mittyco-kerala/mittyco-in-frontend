import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../../lib/ApiClient";
import "../styles/OrderDetails.css";
import { getImageUrl } from "../../../utils/imageUrl";
import DirhamAmount from "../../../components/DirhamAmount";

const OrderDetails = () => {

    const { id } = useParams();

    const navigate = useNavigate();

    const [order, setOrder] = useState(null);

    const [status, setStatus] = useState("");

    const [loading, setLoading] = useState(true);

    const getOrderDetails = async () => {

        try {

            const response = await client.get(
                `/admin-order-details/${id}/`
            );

            setOrder(
                response.data
            );

            setStatus(
                response.data.status
            );

        }

        catch (error) {

            console.log(error);

        }

        finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        getOrderDetails();

    }, []);

    const updateStatus = async () => {

        try {

            await client.put(
                `/update-order-status/${id}/`,
                {
                    status
                }
            );

            alert(
                "Order status updated successfully."
            );

            getOrderDetails();

        }

        catch (error) {

            console.log(error);

        }

    };

    const printInvoice = () => {

        window.print();

    };

    if (loading) {

        return (

            <div className="admin-order-loading">

                Loading...

            </div>

        );

    }

    return (

        <div className="admin-order-page">

            <div className="admin-order-header no-print">

                <button
                    className="admin-back-btn"
                    onClick={() => navigate(-1)}
                >

                    ← Back

                </button>

                <div>

                    <h2>

                        #{`ORD-${String(order.id).padStart(3, "0")}`}

                    </h2>

                    <p>

                        {new Date(
                            order.created_at
                        ).toLocaleString()}

                    </p>

                </div>

                <div className="admin-order-actions">

                    <button
                        className="admin-print-btn"
                        onClick={() => navigate(`/mittyco-dashboard/invoice/${order.id}`)}
                    >
                        🖨 Print Invoice
                    </button>

                </div>

            </div>

            <div className="admin-order-grid">

                <div className="admin-order-card">

                    <h3>

                        Customer Details

                    </h3>

                    <div className="admin-detail-row">

                        <span>

                            Name

                        </span>

                        <strong>

                            {order.customer_name}

                        </strong>

                    </div>

                    <div className="admin-detail-row">

                        <span>

                            Email

                        </span>

                        <strong>

                            {order.customer_email}

                        </strong>

                    </div>

                    <div className="admin-detail-row">

                        <span>

                            Phone

                        </span>

                        <strong>

                            {order.address_phone}

                        </strong>

                    </div>

                </div>

                <div className="admin-order-card">

                    <h3>

                        Shipping Address

                    </h3>

                    <p>

                        {order.address_name}

                    </p>

                    <p>

                        {order.address_line}

                    </p>

                    <p>

                        {order.city}

                    </p>

                    <p>

                        {order.postcode}

                    </p>

                    <p>

                        {order.country}

                    </p>

                </div>

                <div className="admin-order-card">

                    <h3>

                        Payment Details

                    </h3>



                    <div className="admin-detail-row">

                        <span>

                            Payment

                        </span>

                        <strong>

                            {order.payment_status}

                        </strong>

                    </div>

                    <div className="admin-detail-row">

                        <span>

                            Total

                        </span>

                        <strong>

                            <DirhamAmount value={order.total_amount} />

                        </strong>

                    </div>

                </div>

            </div>
            <div className="admin-order-card">

                <h3>

                    Ordered Products

                </h3>

                <div className="admin-order-table">

                    <table>

                        <thead>

                            <tr>

                                <th>Image</th>

                                <th>Product</th>

                                <th>Color</th>

                                <th>Size</th>

                                <th>Qty</th>

                                <th>Price</th>

                            </tr>

                        </thead>

                        <tbody>

                            {

                                order.items.map(

                                    (item) => (

                                        <tr key={item.id}>

                                            <td>

                                                <img
                                                    src={getImageUrl(item.product_image)}
                                                    alt={item.product_name}
                                                    className="admin-product-image"
                                                />

                                            </td>

                                            <td>

                                                {item.product_name}

                                            </td>

                                            <td>

                                                {item.color}

                                            </td>

                                            <td>

                                                {item.size}

                                            </td>

                                            <td>

                                                {item.quantity}

                                            </td>

                                            <td>

                                                <DirhamAmount value={item.price} />

                                            </td>

                                        </tr>

                                    )

                                )

                            }

                        </tbody>

                    </table>

                </div>

            </div>

            <div className="admin-order-bottom">

                <div className="admin-order-card">

                    <h3>

                        Order Summary

                    </h3>

                    <div className="admin-detail-row">

                        <span>
                            Subtotal
                        </span>

                        <strong>
                            <DirhamAmount value={order.subtotal || 0} />
                        </strong>

                    </div>



                    <div className="admin-detail-row">

                        <span>
                            Shipping
                        </span>

                        <strong>
                            {
                                Number(order.shipping_charge || 0) === 0
                                    ? "Free"
                                    : <DirhamAmount value={order.shipping_charge} />
                            }
                        </strong>

                    </div>


                    <div className="admin-detail-row admin-order-grand-total">

                        <span>
                            Total Amount
                        </span>

                        <strong>
                            <DirhamAmount value={order.total_amount || 0} />
                        </strong>

                    </div>

                    <div className="admin-detail-row">

                        <span>

                            Payment Status

                        </span>

                        <strong>

                            {order.payment_status}

                        </strong>

                    </div>

                    <div className="admin-detail-row">

                        <span>

                            Order Status

                        </span>

                        <strong>

                            {order.status}

                        </strong>

                    </div>

                </div>

                <div className="admin-order-card no-print">

                    <h3>

                        Update Status

                    </h3>

                    <select

                        value={status}

                        onChange={(e) =>

                            setStatus(

                                e.target.value

                            )

                        }

                    >

                        <option>

                            Pending

                        </option>

                        <option>

                            Processing

                        </option>

                        <option>

                            Shipped

                        </option>

                        <option>

                            Delivered

                        </option>
                        <option>

                            Cancelled

                        </option>

                    </select>

                    <button

                        className="admin-update-btn"

                        onClick={updateStatus}

                    >

                        Update Status

                    </button>

                </div>

            </div>

        </div>

    );

};

export default OrderDetails;
