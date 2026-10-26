export const PAYMENT_MESSAGES = {
    invalidSession: "Payment is incomplete or this Cashfree payment order is invalid.",
    refunded: "Payment was refunded because the item could not be fulfilled.",
    unauthorized: "You are not authorized to access this payment order.",
    support: "We could not verify your payment. Please contact support before trying again.",
    generic: "We could not verify this payment. Please check your orders before trying again.",
};

export function getPaymentFailure(error) {
    const status = error?.response?.status;
    const data = error?.response?.data || {};

    if (status === 409 && data.payment_status === "Refunded") {
        return { message: PAYMENT_MESSAGES.refunded, title: "Payment Refunded" };
    }

    if (status === 400) {
        return { message: PAYMENT_MESSAGES.invalidSession, title: "Payment Not Completed" };
    }

    if (status === 403) {
        return {
            message: PAYMENT_MESSAGES.unauthorized,
            title: "Payment Order Unavailable",
            returnToOrders: true,
        };
    }

    if (status === 500) {
        return { message: PAYMENT_MESSAGES.support, title: "Payment Verification Unavailable" };
    }

    return { message: PAYMENT_MESSAGES.generic, title: "Payment Not Confirmed" };
}

export function getOrderId(data = {}) {
    return data.order_id ?? data.order?.id ?? null;
}
