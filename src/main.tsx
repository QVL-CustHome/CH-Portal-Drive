import { CanopI18nProvider, CanopThemeProvider } from "canopui";
import "canopui/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { defaultLocale, messages } from "./i18n/messages";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CanopI18nProvider locale={defaultLocale} messages={messages}>
      <CanopThemeProvider defaultMode="system">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CanopThemeProvider>
    </CanopI18nProvider>
  </StrictMode>
);
