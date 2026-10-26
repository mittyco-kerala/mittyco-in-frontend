import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
    navigate: vi.fn(),
    params: {},
    listResource: vi.fn(),
    getResource: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
    useNavigate: () => mocks.navigate,
    useParams: () => mocks.params,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../services/adminApi", () => ({
    createResource: vi.fn(), deleteResource: vi.fn(), flattenApiErrors: vi.fn(() => ({})), getErrorMessage: vi.fn(() => "Request failed"),
    getResource: (...args) => mocks.getResource(...args), listResource: (...args) => mocks.listResource(...args), updateResource: vi.fn(),
}));

import ProductEditor from "./ProductEditor";

const products = [
    { id: 1, name: "Coffee Beans" }, { id: 2, name: "Tea Set" }, { id: 3, name: "Travel Mug" }, { id: 4, name: "Biscuits" }, { id: 5, name: "Current Product" },
];

function listPayload(resource) {
    return { data: { results: resource === "products" ? products : [] } };
}

beforeEach(() => {
    mocks.params = {};
    mocks.navigate.mockReset();
    mocks.listResource.mockImplementation((resource) => Promise.resolve(listPayload(resource)));
    mocks.getResource.mockResolvedValue({ data: {} });
});
afterEach(cleanup);

async function addProduct(user, name) {
    const input = screen.getByLabelText("Find a product to add");
    await user.clear(input);
    await user.type(input, name);
    await user.click(await screen.findByRole("option", { name }));
}

describe("product editor related-products configuration", () => {
    it("loads dashboard brands into the product brand selector", async () => {
        mocks.listResource.mockImplementation((resource) => Promise.resolve({ data: { results: resource === "brands" ? [{ id: 9, name: "Apple" }] : resource === "products" ? products : [] } }));

        render(<ProductEditor />);

        expect(await screen.findByRole("option", { name: "Apple" })).toHaveValue("9");
        expect(mocks.listResource).toHaveBeenCalledWith("brands", { page_size: 500 });
    });

    it("shows automatic mode guidance and clears the manual UI when mode changes", async () => {
        const user = userEvent.setup();
        render(<ProductEditor />);
        await user.click(await screen.findByLabelText("Automatic"));
        expect(screen.getByText("Related products will be automatically selected based on category, subcategory, product relevance, brand, and availability.")).toBeVisible();
        expect(screen.queryByLabelText("Find a product to add")).not.toBeInTheDocument();
        await user.click(screen.getByLabelText("None"));
        expect(screen.queryByText(/automatically selected based on category/i)).not.toBeInTheDocument();
    });

    it("limits manual selection to four products and supports accessible ordering", async () => {
        const user = userEvent.setup();
        render(<ProductEditor />);
        await user.click(await screen.findByLabelText("Manual"));
        await addProduct(user, "Coffee Beans");
        await addProduct(user, "Tea Set");
        await addProduct(user, "Travel Mug");
        await addProduct(user, "Biscuits");
        expect(screen.getByText("4/4")).toBeVisible();
        expect(screen.getByText("You can select a maximum of four related products.")).toBeVisible();
        expect(screen.queryByLabelText("Find a product to add")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Move Coffee Beans down" }));
        const rows = screen.getAllByRole("listitem");
        expect(within(rows[0]).getByText("Tea Set")).toBeVisible();
        expect(within(rows[1]).getByText("Coffee Beans")).toBeVisible();
    });

    it("loads saved manual selections in their backend position order", async () => {
        mocks.params = { id: "5" };
        mocks.getResource.mockResolvedValue({ data: { id: 5, name: "Current Product", description: "Current description", category: 1, subcategory: 1, related_product_mode: "manual", manual_related_products: [{ id: 2, name: "Tea Set", position: 1 }, { id: 1, name: "Coffee Beans", position: 0 }] } });
        const user = userEvent.setup();
        render(<ProductEditor />);
        await screen.findByText("Coffee Beans");
        const rows = screen.getAllByRole("listitem");
        expect(within(rows[0]).getByText("Coffee Beans")).toBeVisible();
        expect(within(rows[1]).getByText("Tea Set")).toBeVisible();
        expect(screen.queryByRole("option", { name: "Current Product" })).not.toBeInTheDocument();
        await user.click(screen.getByLabelText("Automatic"));
        expect(screen.getByText(/automatically selected based on category/i)).toBeVisible();
    });
});
