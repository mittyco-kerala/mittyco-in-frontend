import { afterEach, describe, expect, it, vi } from "vitest";
import handler, { createProductShareHtml } from "./product-share.js";

describe("product share metadata", () => {
    it("publishes the selected variant image and canonical URL", () => {
        const canonicalUrl =
            "https://mittycofoods.com/single/5/turmeric-powder-500-g-price-1?variant=12&size=34";
        const imageUrl = "https://mittycofoods.com/backend/media/turmeric-500.jpg";

        const html = createProductShareHtml({
            canonicalUrl,
            description: "Turmeric powder in the selected 500 g unit.",
            imageUrl,
            title: "Turmeric Powder – 500 g | Mittyco",
        });

        expect(html).toContain(`<meta property="og:image" content="${imageUrl}"`);
        const escapedCanonicalUrl = canonicalUrl.replaceAll("&", "&amp;");
        expect(html).toContain(`<meta property="og:url" content="${escapedCanonicalUrl}"`);
        expect(html).toContain(`<link rel="canonical" href="${escapedCanonicalUrl}"`);
        expect(html).toContain("window.location.replace");
    });

    it("uses the variant and unit from the shared URL when building metadata", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
            id: 5,
            name: "Turmeric Powder",
            description: "Fresh turmeric powder.",
            variants: [
                {
                    id: 11,
                    color: { id: 1, name: "Red" },
                    images: [{ image: "/media/red.jpg", is_primary: true }],
                    price_type: "single",
                    price: 1,
                },
                {
                    id: 12,
                    color: { id: 2, name: "Yellow" },
                    images: [{ image: "/media/yellow.jpg", is_primary: true }],
                    price_type: "multiple",
                    sizes: [{
                        id: 34,
                        unit: { id: 3, name: "500 g" },
                        unit_type: { id: 4, name: "Weight" },
                        price: 2,
                    }],
                },
            ],
        }), { status: 200, headers: { "Content-Type": "application/json" } })));

        const response = await handler(new Request(
            "https://mittycofoods.com/api/product-share?id=5&slug=turmeric-powder&variant=12&size=34",
        ));
        const html = await response.text();

        expect(html).toContain("https://mittycofoods.com/backend/media/yellow.jpg");
        expect(html).toContain("variant=12&amp;size=34");
        expect(html).toContain("Turmeric Powder");
    });

    afterEach(() => vi.unstubAllGlobals());
});
