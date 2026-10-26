import { describe, expect, it } from "vitest";
import { getSafeCheckoutUrl } from "./checkoutUrl";

describe("getSafeCheckoutUrl", () => {
    it("allows Stripe Checkout URLs over HTTPS", () => {
        expect(getSafeCheckoutUrl("https://checkout.stripe.com/c/pay/example")).toBe("https://checkout.stripe.com/c/pay/example");
    });

    it("rejects non-HTTPS and untrusted payment destinations", () => {
        expect(() => getSafeCheckoutUrl("http://checkout.stripe.com/c/pay/example")).toThrow(/untrusted/i);
        expect(() => getSafeCheckoutUrl("https://attacker.example/payment")).toThrow(/untrusted/i);
    });
});
