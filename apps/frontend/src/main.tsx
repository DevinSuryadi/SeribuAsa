import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { HelmetProvider as HelmetProviderBase } from "react-helmet-async";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HelmetProvider = HelmetProviderBase as any;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
