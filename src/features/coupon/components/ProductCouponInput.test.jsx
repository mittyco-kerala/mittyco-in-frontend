import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductCouponInput from "./ProductCouponInput";

describe("existing product coupon input", () => {
    it("uses one coupon input for coupon and redemption codes and retains the Apply action", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const onApply = vi.fn();
        render(<ProductCouponInput value="" onChange={onChange} onApply={onApply} />);
        const input = screen.getByRole("textbox", { name: "Coupon or redemption code" });
        expect(input).toHaveAttribute("placeholder", "Enter coupon / redemption code");
        await user.type(input, "WELCOME-123");
        await user.click(screen.getByRole("button", { name: "Apply Coupon" }));
        expect(onChange).toHaveBeenCalled();
        expect(onApply).toHaveBeenCalledOnce();
        expect(screen.getAllByRole("textbox")).toHaveLength(1);
    });
});
