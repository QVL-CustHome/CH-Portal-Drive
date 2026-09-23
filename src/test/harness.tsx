import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CanopI18nProvider, CanopThemeProvider } from "canopui";
import { defaultLocale, messages } from "../i18n/messages";
import { StorageContext, type StorageContextValue } from "../context/storage";
import { UploadProvider } from "../context/UploadProvider";
import type { Node } from "../api/drive";

export const storageStub: StorageContextValue = {
  storage: { quota_bytes: 1_000_000, used_bytes: 100_000 },
  loading: false,
  loadError: false,
  reload: () => {},
};

type ThemeMode = "light" | "dark";

export function renderWithProviders(ui: ReactElement, mode: ThemeMode = "light") {
  return render(
    <CanopI18nProvider locale={defaultLocale} messages={messages} storageKey={null}>
      <CanopThemeProvider defaultMode={mode} storageKey={null}>
        <MemoryRouter>
          <StorageContext.Provider value={storageStub}>
            <UploadProvider>{ui}</UploadProvider>
          </StorageContext.Provider>
        </MemoryRouter>
      </CanopThemeProvider>
    </CanopI18nProvider>
  );
}

type NodeSeed = Partial<Node> & Pick<Node, "id" | "name" | "kind">;

export function makeNode(seed: NodeSeed): Node {
  return {
    parent_id: "root",
    mime: null,
    size_bytes: 0,
    is_media: false,
    media_type: null,
    width: null,
    height: null,
    duration_ms: null,
    has_thumbnail: false,
    taken_at: null,
    trashed: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...seed,
  };
}

export function useGridView() {
  window.localStorage.setItem("drive.viewMode", "grid");
}

export function useListView() {
  window.localStorage.setItem("drive.viewMode", "list");
}
