import { describe, expect, it } from "vitest";
import { getOrderId, getPaymentFailure, PAYMENT_MESSAGES } from "./paymentResult";

describe("payment result handling", () => {
    it("renders the required refunded message without an automatic checkout retry", () => {
        expect(getPaymentFailure({ response: { status: 409, data: { payment_status: "Refunded" } } })).toEqual({
            message: PAYMENT_MESSAGES.refunded,
            title: "Payment Refunded",
        });
    });

    it.each([
        [400, PAYMENT_MESSAGES.invalidSession],
        [403, PAYMENT_MESSAGES.unauthorized],
        [500, PAYMENT_MESSAGES.support],
    ])("maps HTTP %s to the secured payment message", (status, message) => {
        expect(getPaymentFailure({ response: { status, data: {} } }).message).toBe(message);
    });

    it("uses the backend order_id from a successful payment", () => {
        expect(getOrderId({ order_id: "ORD-123" })).toBe("ORD-123");
    });
});
