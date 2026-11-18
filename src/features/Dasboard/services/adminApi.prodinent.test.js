import { describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
}));

vi.mock("../../../lib/ApiClient", () => ({ default: client }));

import {
    assignProdinentBarcode,
    bookProdinentShipment,
    downloadProdinentLabel,
    refreshProdinentTracking,
    syncProdinentOrder,
} from "./adminApi";

describe("Prodinent admin order actions", () => {
    it("uses protected order action endpoints", () => {
        syncProdinentOrder(42);
        assignProdinentBarcode(42);
        bookProdinentShipment(42);
        refreshProdinentTracking(42);

        expect(client.post).toHaveBeenNthCalledWith(1, "/admin/manage/orders/42/prodinent-sync/");
        expect(client.post).toHaveBeenNthCalledWith(2, "/admin/manage/orders/42/prodinent-barcode/");
        expect(client.post).toHaveBeenNthCalledWith(3, "/admin/manage/orders/42/prodinent-book/");
        expect(client.post).toHaveBeenNthCalledWith(4, "/admin/manage/orders/42/prodinent-track/");
    });

    it("requests the label as a PDF blob", () => {
        downloadProdinentLabel(42);

        expect(client.get).toHaveBeenCalledWith(
            "/admin/manage/orders/42/prodinent-label/",
            { responseType: "blob" },
        );
    });
});
