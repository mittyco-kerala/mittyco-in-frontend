import { describe, expect, it } from "vitest";
import { assertJsonApiResponse, getApiErrorMessage, HTML_API_RESPONSE_MESSAGE, isUnexpectedHtmlResponse } from "./apiResponse";

describe("API response validation", () => {
    it("detects HTML returned from a misrouted API request", () => {
        expect(isUnexpectedHtmlResponse({ headers: { "content-type": "text/html; charset=utf-8" }, data: "<!doctype html><html>" })).toBe(true);
        expect(() => assertJsonApiResponse({ status: 200, headers: { "content-type": "text/html" }, data: "<html>" })).toThrow(HTML_API_RESPONSE_MESSAGE);
    });

    it("allows JSON API responses", () => {
        const response = { status: 200, headers: { "content-type": "application/json" }, data: { results: [] } };
        expect(assertJsonApiResponse(response)).toBe(response);
    });

    it("formats Django field validation errors for auth forms", () => {
        expect(getApiErrorMessage({ response: { data: { email: ["Enter a valid email address."], password: ["Password is too short."] } } }))
            .toBe("email: Enter a valid email address. | password: Password is too short.");
    });
});
