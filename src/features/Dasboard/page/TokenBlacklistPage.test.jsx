import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({ outstanding: vi.fn(), blacklisted: vi.fn(), blacklist: vi.fn(), toastSuccess: vi.fn(), toastError: vi.fn() }));

vi.mock("../services/adminApi", () => ({
    blacklistToken: (...args) => mocks.blacklist(...args),
    getBlacklistedTokens: (...args) => mocks.blacklisted(...args),
    getErrorMessage: () => "Request failed",
    getOutstandingTokens: (...args) => mocks.outstanding(...args),
    unwrapList: (payload) => Array.isArray(payload) ? { rows: payload, count: payload.length } : { rows: payload?.results || [], count: payload?.count ?? payload?.results?.length ?? 0, next: payload?.next, previous: payload?.previous },
}));
vi.mock("sonner", () => ({ toast: { success: (...args) => mocks.toastSuccess(...args), error: (...args) => mocks.toastError(...args) } }));

import TokenBlacklistPage from "./TokenBlacklistPage";

const outstandingRows = [
    { id: 7, jti: "active-jti", user_id: 9, user_email: "active@example.com", created_at: "2026-10-08T08:15:00Z", expires_at: "2026-10-20T08:15:00Z", is_blacklisted: false },
    { id: 8, jti: "revoked-jti", user_id: 10, user_email: "revoked@example.com", created_at: "2026-10-08T08:15:00Z", expires_at: "2026-10-20T08:15:00Z", is_blacklisted: true },
];

beforeEach(() => {
    mocks.outstanding.mockResolvedValue({ data: { results: outstandingRows, count: outstandingRows.length } });
    mocks.blacklisted.mockResolvedValue({ data: { results: [{ id: 12, outstanding_token_id: 7, jti: "revoked-jti", user_id: 9, user_email: "active@example.com", token_created_at: "2026-10-08T08:15:00Z", token_expires_at: "2026-10-20T08:15:00Z", blacklisted_at: "2026-10-09T08:15:00Z" }], count: 1 } });
    mocks.blacklist.mockResolvedValue({ data: { already_blacklisted: false } });
});

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Token Blacklist dashboard", () => {
    it("shows outstanding metadata, confirms blacklisting, then refreshes without exposing a token value", async () => {
        const user = userEvent.setup();
        render(<TokenBlacklistPage type="outstanding" />);

        expect(await screen.findByRole("heading", { name: "Outstanding Tokens" })).toBeVisible();
        expect(await screen.findByText("active@example.com")).toBeVisible();
        expect(screen.getByText("active-jti")).toBeVisible();
        expect(screen.getByText("Active")).toBeVisible();
        expect(screen.getByText("Blacklisted")).toBeVisible();
        expect(screen.getByText("Swipe the table horizontally to view all token metadata.")).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: "Blacklist active token" })).toHaveLength(1);

        await user.click(screen.getByRole("button", { name: "Blacklist active token" }));
        expect(screen.getByRole("heading", { name: "Blacklist Token" })).toBeVisible();
        await user.click(screen.getByRole("button", { name: "Blacklist Token" }));
        await waitFor(() => expect(mocks.blacklist).toHaveBeenCalledWith(7));
        await waitFor(() => expect(mocks.outstanding).toHaveBeenCalledTimes(2));
        expect(mocks.toastSuccess).toHaveBeenCalledWith("Token blacklisted.");
    });

    it("uses the current search value and renders blacklisted metadata as read-only", async () => {
        const user = userEvent.setup();
        render(<TokenBlacklistPage type="blacklisted" />);

        expect(await screen.findByRole("heading", { name: "Blacklisted Tokens" })).toBeVisible();
        expect(await screen.findByRole("columnheader", { name: "Blacklisted At" })).toBeVisible();
        expect(screen.queryByRole("button", { name: "Blacklist active token" })).not.toBeInTheDocument();
        await user.type(screen.getByRole("textbox", { name: "Search user email or JTI..." }), "active@example.com");
        await waitFor(() => expect(mocks.blacklisted).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, page_size: 10, search: "active@example.com" })));
    });
});
