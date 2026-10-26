import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), list: vi.fn(), remove: vi.fn(), toggle: vi.fn() }));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../services/adminApi", () => ({
    deleteResource: (...args) => mocks.remove(...args),
    getErrorMessage: () => "Request failed",
    listResource: (...args) => mocks.list(...args),
    toggleWelcomeBonusActive: (...args) => mocks.toggle(...args),
    unwrapList: (payload) => Array.isArray(payload) ? { rows: payload, count: payload.length } : { rows: payload?.results || [], count: payload?.count ?? payload?.results?.length ?? 0, next: payload?.next, previous: payload?.previous },
}));

import WelcomeBonusPage from "./WelcomeBonusPage";

const row = { id: 18, name: "First order bonus", applicability_type: "PRODUCT", product: 2, discount_type: "PERCENTAGE", discount_percentage: 10, start_date: "2026-10-10T10:00:00Z", end_date: "2026-10-20T10:00:00Z", is_active: true, assigned_users_count: 4, claimed_users_count: 2, redeemed_users_count: 1 };

beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.remove.mockResolvedValue({});
    mocks.toggle.mockResolvedValue({});
    mocks.list.mockImplementation((resource) => Promise.resolve({ data: resource === "welcome-bonuses" ? { results: [row], count: 1 } : { results: resource === "products" ? [{ id: 2, name: "Travel Mug" }] : [] } }));
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Welcome Bonus dashboard list", () => {
    it("keeps Welcome Bonuses separate and provides view, one toggle, and delete confirmation actions", async () => {
        const user = userEvent.setup();
        render(<WelcomeBonusPage />);
        expect(await screen.findByText("First order bonus")).toBeVisible();
        expect(screen.getByText("Swipe the table horizontally to view all columns and actions.")).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Assigned Users" })).toBeVisible();
        expect(screen.getByRole("columnheader", { name: "Redeemed Users" })).toBeVisible();

        await user.click(screen.getByLabelText("View Welcome Bonus"));
        expect(await screen.findByRole("dialog", { name: "Welcome Bonus details" })).toBeVisible();
        await user.click(screen.getByRole("button", { name: "Close" }));

        await user.click(screen.getByLabelText("Deactivate Welcome Bonus"));
        await waitFor(() => expect(mocks.toggle).toHaveBeenCalledWith(18));

        await user.click(screen.getByLabelText("Delete Welcome Bonus"));
        expect(screen.getByRole("heading", { name: "Delete or archive Welcome Bonus" })).toBeVisible();
        await user.click(screen.getByRole("button", { name: "Delete" }));
        await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("welcome-bonuses", 18));
    });
});
