import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("../../../lib/ApiClient", () => ({ default: client }));

import { blacklistToken, getBlacklistedTokens, getOutstandingTokens } from "./adminApi";

describe("Token Blacklist admin API", () => {
    beforeEach(() => vi.clearAllMocks());

    it("uses only the Super Admin JSON endpoints and sends no token value", () => {
        const params = { page: 2, search: "admin@example.com" };
        getOutstandingTokens(params);
        getBlacklistedTokens(params);
        blacklistToken(41);

        expect(client.get).toHaveBeenNthCalledWith(1, "/admin/manage/token-blacklist/outstanding-tokens/", { params });
        expect(client.get).toHaveBeenNthCalledWith(2, "/admin/manage/token-blacklist/blacklisted-tokens/", { params });
        expect(client.post).toHaveBeenCalledWith("/admin/manage/token-blacklist/outstanding-tokens/41/blacklist/");
    });
});
