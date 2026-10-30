const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";

let razorpayScriptPromise;

export function loadRazorpayCheckout() {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("Razorpay checkout is only available in a browser."));
    }

    if (window.Razorpay) return Promise.resolve(window.Razorpay);
    if (razorpayScriptPromise) return razorpayScriptPromise;

    razorpayScriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_URL}"]`);
        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(window.Razorpay), { once: true });
            existingScript.addEventListener("error", () => reject(new Error("Could not load Razorpay checkout.")), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = RAZORPAY_CHECKOUT_URL;
        script.async = true;
        script.onload = () => window.Razorpay
            ? resolve(window.Razorpay)
            : reject(new Error("Razorpay checkout is unavailable."));
        script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
        document.body.appendChild(script);
    }).catch((error) => {
        razorpayScriptPromise = null;
        throw error;
    });

    return razorpayScriptPromise;
}
