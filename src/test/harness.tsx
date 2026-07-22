import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ChI18nProvider, ChThemeProvider } from "canopui";
import { defaultLocale, messages } from "../i18n/messages";
import { StorageContext, type StorageContextValue } from "../context/storage";
import type { Node } from "../api/drive";

export const storageStub: StorageContextValue = {
  storage: { quota_bytes: 1_000_000, used_bytes: 100_000 },
  loading: false,
  loadError: false,
  reload: () => {},
};

export function renderWithProviders(ui: ReactElement) {
  return render(
    <ChI18nProvider locale={defaultLocale} messages={messages} storageKey={null}>
      <ChThemeProvider defaultMode="light">
        <MemoryRouter>
          <StorageContext.Provider value={storageStub}>{ui}</StorageContext.Provider>
        </MemoryRouter>
      </ChThemeProvider>
    </ChI18nProvider>
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
