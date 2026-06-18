import { ChI18nProvider, ChThemeProvider } from "@custhome/ui";
import "@custhome/ui/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { defaultLocale, messages } from "./i18n/messages";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChI18nProvider locale={defaultLocale} messages={messages}>
      <ChThemeProvider defaultMode="light">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ChThemeProvider>
    </ChI18nProvider>
  </StrictMode>
);
