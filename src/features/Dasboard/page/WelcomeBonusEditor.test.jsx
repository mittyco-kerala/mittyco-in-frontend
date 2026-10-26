import { describe, expect, it } from "vitest";
import { validateWelcomeBonus, welcomeBonusPayload } from "./welcomeBonusForm";

const validValues = {
    name: "New customer offer", applicability_type: "PRODUCT", product: "5", category: "", discount_type: "PERCENTAGE", discount_percentage: "15", fixed_amount: "", start_date: "2026-10-10T10:00", end_date: "2026-10-20T10:00", is_active: true,
};

describe("Welcome Bonus form contract", () => {
    it("rejects missing targets, invalid percentage values, and invalid dates before submission", () => {
        expect(validateWelcomeBonus({ ...validValues, product: "", discount_percentage: "101", end_date: "2026-10-09T10:00" })).toMatchObject({ product: expect.any(String), discount_percentage: expect.any(String), end_date: expect.any(String) });
    });

    it("produces a Welcome Bonus payload without a redemption-code field", () => {
        const payload = welcomeBonusPayload(validValues);
        expect(payload).toMatchObject({ name: "New customer offer", applicability_type: "PRODUCT", product: 5, category: null, discount_type: "PERCENTAGE", discount_percentage: 15, fixed_amount: null, is_active: true });
        expect(payload).not.toHaveProperty("code");
        expect(payload).not.toHaveProperty("redemption_code");
    });
});
