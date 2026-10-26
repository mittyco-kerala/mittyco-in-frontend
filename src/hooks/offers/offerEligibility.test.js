import { describe, expect, it } from "vitest";
import { isOfferActive } from "./offerEligibility";

describe("isOfferActive", () => {
    const now = new Date("2026-10-09T10:00:00Z");

    it("accepts an active offer within its date range", () => {
        expect(isOfferActive({ is_active: true, start_date: "2026-10-01", end_date: "2026-10-09" }, now)).toBe(true);
    });

    it("rejects inactive, expired, future, and malformed offers", () => {
        expect(isOfferActive({ is_active: false }, now)).toBe(false);
        expect(isOfferActive({ is_active: true, end_date: "2026-10-08" }, now)).toBe(false);
        expect(isOfferActive({ is_active: true, start_date: "2026-10-10" }, now)).toBe(false);
        expect(isOfferActive({ is_active: true, end_date: "not-a-date" }, now)).toBe(false);
    });
});
