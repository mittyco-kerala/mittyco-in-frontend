import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import "./../index.css";
import App from "./App.jsx";
import { GOOGLE_CLIENT_ID } from "../features/auth/googleConfig";

const clientQuery = new QueryClient();
const application = (
  <BrowserRouter>
    <App />
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={3000}
      toastOptions={{
        style: {
          background: "#FFF8D7",
          color: "#1F5B3E",
          border: "1px solid #F5E5A6",
          borderRadius: "16px",
          padding: "14px 18px",
          fontWeight: "700",
        },
      }}
    />
  </BrowserRouter>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={clientQuery}>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          {application}
        </GoogleOAuthProvider>
      ) : application}
    </QueryClientProvider>
  </StrictMode>
);
