import { describe, expect, it } from "vitest";
import { formatHomepagePrice, getHomepageProductPricing } from "./productPricing";

describe("getHomepageProductPricing", () => {
    it("uses backend prices to calculate a valid discount", () => {
        const pricing = getHomepageProductPricing({
            original_price: "1999",
            discounted_price: "1499",
            discount_percentage: 30,
            has_offer: true,
        });

        expect(pricing).toMatchObject({
            currentPrice: 1499,
            originalPrice: 1999,
            discountPercentage: 25.01,
            hasOffer: true,
        });
    });

    it("does not show an original price without a real price reduction", () => {
        const pricing = getHomepageProductPricing({
            original_price: 1499,
            current_price: 1499,
            discount_percentage: 0,
        });

        expect(pricing).toMatchObject({
            currentPrice: 1499,
            originalPrice: null,
            discountPercentage: null,
            hasOffer: false,
        });
    });

    it("does not trust a discount percentage when the prices are unchanged", () => {
        const pricing = getHomepageProductPricing({
            original_price: 1499,
            discounted_price: 1499,
            discount_percentage: 20,
            has_offer: true,
        });

        expect(pricing).toMatchObject({
            originalPrice: null,
            discountPercentage: null,
            hasOffer: false,
        });
    });

    it("safely handles missing, zero, and invalid price data", () => {
        const pricing = getHomepageProductPricing({ original_price: 0, discounted_price: "not-a-price" });

        expect(pricing.currentPrice).toBeNull();
        expect(formatHomepagePrice(pricing.currentPrice)).toBe("Price unavailable");
    });

    it("does not promote an expired linked offer", () => {
        const pricing = getHomepageProductPricing({
            original_price: 100,
            discounted_price: 75,
            has_offer: true,
            offer: { is_active: true, end_date: "2025-01-01" },
        }, null, new Date("2026-10-09T10:00:00Z"));

        expect(pricing).toMatchObject({
            currentPrice: 75,
            originalPrice: null,
            discountPercentage: null,
            hasOffer: false,
        });
    });
});
