import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
    get: vi.fn(), claim: vi.fn(), copy: vi.fn(), read: vi.fn(), toastSuccess: vi.fn(), toastError: vi.fn(), clipboardWrite: vi.fn(),
}));

vi.mock("../api/welcomeBonusApi", () => ({
    getWelcomeBonusNotifications: (...args) => mocks.get(...args),
    claimWelcomeBonus: (...args) => mocks.claim(...args),
    copyWelcomeBonusCode: (...args) => mocks.copy(...args),
    markWelcomeBonusNotificationRead: (...args) => mocks.read(...args),
}));
vi.mock("../../../utils/toast", () => ({ default: { success: (...args) => mocks.toastSuccess(...args), error: (...args) => mocks.toastError(...args) } }));

import WelcomeBonusNotifications from "./WelcomeBonusNotifications";

let payload;
const response = () => Promise.resolve({ data: payload });

beforeEach(() => {
    sessionStorage.setItem("authenticated", "true");
    sessionStorage.setItem("user_id", "42");
    payload = {
        unread_count: 1,
        notifications: [{ id: 7, title: "A welcome gift", message: "Use your Welcome Bonus on your first order.", discount_text: "10% off", eligible_target: "Valid for: Travel Mug", masked_code: "••••••••••••••••", can_claim: true, can_copy_code: false, is_read: false }],
    };
    mocks.get.mockImplementation(response);
    mocks.read.mockResolvedValue({});
    mocks.claim.mockImplementation(async () => {
        payload = { unread_count: 0, notifications: [{ ...payload.notifications[0], can_claim: false, can_copy_code: true, is_read: true }] };
        return {};
    });
    mocks.copy.mockResolvedValue({ data: { code: "PRIVATE-WELCOME-CODE" } });
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    mocks.clipboardWrite.mockReset();
    mocks.clipboardWrite.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, get: () => ({ writeText: mocks.clipboardWrite }) });
});
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); vi.clearAllMocks(); });

describe("Welcome Bonus notifications", () => {
    it("shows the server unread badge and only ever renders a masked code", async () => {
        const user = userEvent.setup();
        render(<WelcomeBonusNotifications />);
        expect(await screen.findByLabelText("Notifications, 1 unread")).toBeVisible();
        await user.click(screen.getByLabelText("Notifications, 1 unread"));
        expect(await screen.findByText("••••••••••••••••")).toBeVisible();
        expect(screen.getByText("1 unread notification")).toBeVisible();
        expect(screen.getByText("Valid for: Travel Mug")).toBeVisible();
        expect(screen.getByText("New")).toBeVisible();
        expect(screen.queryByText("PRIVATE-WELCOME-CODE")).not.toBeInTheDocument();
        expect(mocks.read).toHaveBeenCalledWith(7);
    });

    it("claims then copies directly to the clipboard without rendering or retaining the code", async () => {
        const user = userEvent.setup();
        render(<WelcomeBonusNotifications />);
        const bell = await screen.findByLabelText("Notifications, 1 unread");
        await user.click(bell);
        await user.click(await screen.findByRole("button", { name: "Claim Welcome Bonus" }));
        await waitFor(() => expect(screen.getByRole("button", { name: /copy code/i })).toBeVisible());
        await user.click(screen.getByRole("button", { name: /copy code/i }));
        await waitFor(() => expect(mocks.copy).toHaveBeenCalledWith(7));
        expect(screen.getByRole("button", { name: /copied/i })).toBeVisible();
        expect(document.body.textContent).not.toContain("PRIVATE-WELCOME-CODE");
        expect(JSON.stringify(localStorage)).not.toContain("PRIVATE-WELCOME-CODE");
    });
});
