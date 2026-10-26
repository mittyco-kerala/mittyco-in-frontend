import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../../lib/ApiClient";
import "../styles/Invoice.css";
import { getImageUrl } from "../../../utils/imageUrl";
import DirhamAmount from "../../../components/DirhamAmount";

const Invoice = () => {

    const { id } = useParams();

    const navigate = useNavigate();

    const [order, setOrder] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {

        fetchOrder();


    }, []);

    const fetchOrder = async () => {

        try {

            const response = await client.get(
                `/admin-order-details/${id}/`
            );


            setOrder(response.data);


        } catch {

            setError(
                "Unable to load invoice."
            );

        } finally {

            setLoading(false);

        }

    };

    const handlePrint = () => {

        window.print();

    };



    if (loading) {

        return (
            <div className="invoice-page">
                <div className="invoice-loading">
                    Loading Invoice...
                </div>
            </div>
        );

    }

    if (error) {

        return (
            <div className="invoice-page">
                <div className="invoice-error">
                    {error}
                </div>
            </div>
        );

    }

    return (

        <div className="invoice-page">

            <div className="invoice-top-actions">

                <button
                    className="invoice-back-btn"
                    onClick={() => navigate(-1)}
                >
                    Back
                </button>

                <button
                    className="invoice-print-btn"
                    onClick={handlePrint}
                >
                    Print Invoice
                </button>

            </div>

            <div className="invoice-container">

                <div className="invoice-header">

                    <div className="invoice-company">

                        <h1>
                            Mittyco
                        </h1>

                        <p>
                            59/A, Panayanthatta, Thollathuvayal, Nhekly (P.O.), Peringome, Payyanur, Kannur, Kerala 670353
                        </p>

                        <p>
                            infomittyco@gmail.com
                        </p>

                    </div>

                    <div className="invoice-details">

                        <h2>
                            TAX INVOICE
                        </h2>

                        <div className="invoice-detail-row">

                            <span>
                                Invoice No
                            </span>

                            <strong>
                                INV-{String(order.id).padStart(3, "0")}
                            </strong>

                        </div>

                        <div className="invoice-detail-row">

                            <span>
                                Order ID
                            </span>

                            <strong>
                                {`ORD-${String(order.id).padStart(3, "0")}`}
                            </strong>

                        </div>

                        <div className="invoice-detail-row">

                            <span>
                                Date
                            </span>

                            <strong>
                                {new Date(
                                    order.created_at
                                ).toLocaleDateString()}
                            </strong>

                        </div>

                    </div>

                </div>

                <div className="invoice-address-section">

                    <div className="invoice-address-box">

                        <h4>
                            Bill To
                        </h4>

                        <p>
                            {order.customer_name}
                        </p>

                        <p>
                            {order.customer_email}
                        </p>

                        <p>
                            {order.address_phone}
                        </p>

                    </div>

                    <div className="invoice-address-box">

                        <h4>
                            Shipping Address
                        </h4>

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

                </div>
                <div className="invoice-products">

                    <table className="invoice-table">

                        <thead>

                            <tr>

                                <th>
                                    Product
                                </th>

                                <th>
                                    Color
                                </th>

                                <th>
                                    Size
                                </th>

                                <th>
                                    Qty
                                </th>

                                <th>
                                    Unit Price
                                </th>

                                <th>
                                    Total
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {order.items.map((item) => (

                                <tr key={item.id}>

                                    <td>

                                        <div className="invoice-product-info">

                                            <img
                                                src={getImageUrl(item.product_image)}
                                                alt={item.product_name}
                                            />

                                            <span>

                                                {item.product_name}
                                            </span>

                                        </div>

                                    </td>

                                    <td>
                                        {item.color || "-"}
                                    </td>

                                    <td>
                                        {item.size || "-"}
                                    </td>

                                    <td>
                                        {item.quantity}
                                    </td>

                                    <td>
                                        <DirhamAmount value={item.price} />
                                    </td>

                                    <td>

                                        <DirhamAmount value={Number(item.price) * item.quantity} />

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

                <div className="invoice-bottom-section">

                    <div className="invoice-payment-section">

                        <h4>
                            Payment Information
                        </h4>



                        <div className="invoice-payment-row">

                            <span>
                                Payment Status
                            </span>

                            <strong>
                                {order.payment_status}
                            </strong>

                        </div>

                        <div className="invoice-payment-row">

                            <span>
                                Order Status
                            </span>

                            <strong>
                                {order.status}
                            </strong>

                        </div>

                    </div>

                    <div className="invoice-summary">

                        <div className="invoice-summary-row">

                            <span>
                                Subtotal
                            </span>

                            <span>
                                <DirhamAmount value={order.subtotal || 0} />
                            </span>

                        </div>


                        <div className="invoice-summary-row">

                            <span>
                                Shipping
                            </span>

                            <span>

                                {
                                    Number(order.shipping_charge || 0) === 0
                                        ? "FREE"
                                        : <DirhamAmount value={order.shipping_charge} />
                                }

                            </span>

                        </div>


                        <div className="invoice-summary-total">

                            <span>
                                Grand Total
                            </span>

                            <strong>
                                <DirhamAmount value={order.total_amount || 0} />
                            </strong>

                        </div>

                    </div>

                </div>
                <div className="invoice-footer">

                    <div className="invoice-footer-left">

                        <h4>
                            Thank You!
                        </h4>

                        <p>
                            Thank you for shopping with
                            <strong> Mittyco </strong>.
                        </p>

                        <p>
                            If you have any questions about this invoice,
                            please contact our support team.
                        </p>

                        <p>
                            Email :
                            <strong>
                                {" "}
                                infomittyco@gmail.com
                            </strong>
                        </p>

                    </div>

                    <div className="invoice-footer-right">

                        <div className="invoice-signature">

                            <span>
                                Authorized Signature
                            </span>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

};

export default Invoice;
