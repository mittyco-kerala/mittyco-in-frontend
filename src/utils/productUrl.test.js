import { describe, expect, it } from "vitest";
import { getProductPath, getProductUrl } from "./productUrl";

describe("product URLs", () => {
    it("includes the product name, colour, unit, and unit price in the path", () => {
        const product = {
            id: 42,
            name: "Cold Pressed Coconut Oil",
        };
        const variant = {
            id: 7,
            color: { name: "Natural" },
        };
        const unit = {
            id: 9,
            size: { name: "1 L", unit_type: "Volume" },
            price: "25.50",
        };

        expect(getProductPath(product, variant, unit)).toBe(
            "/single/42/cold-pressed-coconut-oil-natural-volume-1-l-price-25-50",
        );
        expect(getProductUrl(product, variant, unit)).toBe(
            "/single/42/cold-pressed-coconut-oil-natural-volume-1-l-price-25-50?variant=7&size=9",
        );
    });

    it("uses homepage metadata when variant objects are not embedded", () => {
        expect(getProductPath({
            id: 11,
            name: "Mango Pickle",
            default_color_name: "Red",
            default_unit_type_name: "Weight",
            default_unit_name: "500 g",
            starting_price: "18.00",
        })).toBe("/single/11/mango-pickle-red-weight-500-g-price-18-00");
    });

    it("always returns a usable product path when optional details are missing", () => {
        expect(getProductUrl({ id: 5, name: "Plain Product" })).toBe(
            "/single/5/plain-product",
        );
    });
});
