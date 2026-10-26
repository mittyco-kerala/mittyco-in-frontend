import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock("../../../lib/ApiClient", () => ({ default: client }));

import { createResource, deleteResource, toggleWelcomeBonusActive, updateResource } from "./adminApi";

describe("Welcome Bonus admin API", () => {
    beforeEach(() => vi.clearAllMocks());

    it("uses the dedicated Welcome Bonus CRUD and single toggle endpoint", () => {
        const payload = { name: "Welcome 10", applicability_type: "PRODUCT", product: 3, is_active: true };
        createResource("welcome-bonuses", payload);
        updateResource("welcome-bonuses", 12, { name: "Welcome 15" });
        deleteResource("welcome-bonuses", 12);
        toggleWelcomeBonusActive(12);
        expect(client.post).toHaveBeenNthCalledWith(1, "/admin/manage/welcome-bonuses/", payload, undefined);
        expect(client.patch).toHaveBeenCalledWith("/admin/manage/welcome-bonuses/12/", { name: "Welcome 15" }, undefined);
        expect(client.delete).toHaveBeenCalledWith("/admin/manage/welcome-bonuses/12/");
        expect(client.post).toHaveBeenNthCalledWith(2, "/admin/manage/welcome-bonuses/12/toggle-active/");
    });
});
