import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RelatedProductsModal from "./RelatedProductsModal";
import { relatedProductsFromResponse } from "./relatedProducts";

afterEach(cleanup);

const product = (id, overrides = {}) => ({
    id,
    name: `Product ${id}`,
    description: `Description for product ${id}`,
    image: "",
    starting_price: 25,
    discounted_price: 20,
    default_variant_id: `${id}-blue`,
    variants: [{ id: `${id}-blue`, name: "Blue", price_type: "single" }],
    ...overrides,
});

function renderChooser(overrides = {}) {
    const props = {
        products: [product("one"), product("two")],
        sourceProductId: 99,
        onClose: vi.fn(),
        onAddSelected: vi.fn().mockResolvedValue({}),
        onRefreshChoices: vi.fn().mockResolvedValue([]),
        ...overrides,
    };
    return { ...render(<RelatedProductsModal {...props} />), props };
}

describe("related product chooser", () => {
    it("does not produce a prompt from an empty related-products response", () => {
        expect(relatedProductsFromResponse({ related_products: [] })).toEqual([]);
        expect(relatedProductsFromResponse({})).toEqual([]);
    });

    it("limits related-products endpoint results to four items", () => {
        const results = Array.from({ length: 5 }, (_, index) => product(index + 1));

        expect(relatedProductsFromResponse({ results })).toEqual(results.slice(0, 4));
    });

    it("lets a customer decline without making a related cart request", async () => {
        const user = userEvent.setup();
        const { props } = renderChooser();
        await user.click(screen.getByRole("button", { name: "No, Thanks" }));
        expect(props.onClose).toHaveBeenCalledOnce();
        expect(props.onAddSelected).not.toHaveBeenCalled();
    });

    it("adds one or multiple selected products using only allowed cart fields", async () => {
        const user = userEvent.setup();
        const { props } = renderChooser();
        const checks = screen.getAllByRole("checkbox");
        await user.click(checks[0]);
        await user.click(checks[1]);
        await user.click(screen.getByRole("button", { name: "Add Selected (2)" }));
        expect(props.onAddSelected).toHaveBeenCalledWith({
            source_product: 99,
            related_products: [
                { product: "one", variant: "one-blue", quantity: 1 },
                { product: "two", variant: "two-blue", quantity: 1 },
            ],
        });
        expect(props.onClose).toHaveBeenCalledOnce();
    });

    it("requires a selectable variant before confirmation", async () => {
        const user = userEvent.setup();
        const required = product("variant", { requires_variant_selection: true, default_variant_id: null });
        const { props } = renderChooser({ products: [required] });
        await user.click(screen.getByRole("checkbox"));
        expect(screen.getByRole("button", { name: "Add Selected (1)" })).toBeDisabled();
        await user.selectOptions(screen.getByLabelText(/variant/i), "variant-blue");
        expect(screen.getByRole("button", { name: "Add Selected (1)" })).toBeEnabled();
        await user.click(screen.getByRole("button", { name: "Add Selected (1)" }));
        expect(props.onAddSelected).toHaveBeenCalledWith(expect.objectContaining({ related_products: [expect.objectContaining({ variant: "variant-blue" })] }));
    });

    it("refreshes choices and closes safely when selected products become unavailable", async () => {
        const user = userEvent.setup();
        const { props } = renderChooser({ onAddSelected: vi.fn().mockResolvedValue({ unavailable: true }) });
        await user.click(screen.getAllByRole("checkbox")[0]);
        await user.click(screen.getByRole("button", { name: "Add Selected (1)" }));
        expect(props.onRefreshChoices).toHaveBeenCalledOnce();
        expect(props.onClose).toHaveBeenCalledOnce();
    });

    it("shows a recoverable server error and refreshes disallowed selections", async () => {
        const user = userEvent.setup();
        const rejected = { response: { data: { error_code: "RELATED_PRODUCT_NOT_ALLOWED", message: "Not allowed now" } } };
        const { props } = renderChooser({ onAddSelected: vi.fn().mockRejectedValue(rejected) });
        await user.click(screen.getAllByRole("checkbox")[0]);
        await user.click(screen.getByRole("button", { name: "Add Selected (1)" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Not allowed now");
        expect(props.onRefreshChoices).toHaveBeenCalledOnce();
        expect(props.onClose).not.toHaveBeenCalled();
    });

    it("keeps controls reachable at a 320px viewport", () => {
        Object.defineProperty(window, "innerWidth", { configurable: true, value: 320 });
        renderChooser();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "No, Thanks" })).toBeVisible();
    });
});
