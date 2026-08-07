import { describe, expect, it } from "vitest";
import { isPreviewable, previewKind } from "./preview";
import type { Node } from "../api/drive";

function node(overrides: Partial<Node> = {}): Node {
  return {
    id: "n1",
    parent_id: null,
    kind: "file",
    name: "fichier",
    mime: null,
    size_bytes: 10,
    is_media: false,
    media_type: null,
    width: null,
    height: null,
    duration_ms: null,
    has_thumbnail: false,
    taken_at: null,
    trashed: false,
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

describe("previewKind", () => {
  it("reconnaît les images bitmap", () => {
    for (const mime of ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"]) {
      expect(previewKind(node({ mime }))).toBe("image");
    }
  });

  it("reconnaît le PDF comme document", () => {
    expect(previewKind(node({ mime: "application/pdf" }))).toBe("document");
  });

  it("ignore la casse et les paramètres du type MIME", () => {
    expect(previewKind(node({ mime: "IMAGE/JPEG" }))).toBe("image");
    expect(previewKind(node({ mime: "application/pdf; charset=binary" }))).toBe("document");
  });

  it("écarte le SVG, que l'API neutralise et ne sert jamais inline", () => {
    expect(previewKind(node({ mime: "image/svg+xml" }))).toBeNull();
  });

  it("écarte les dossiers et les types non affichables", () => {
    expect(previewKind(node({ kind: "folder", mime: null }))).toBeNull();
    expect(previewKind(node({ mime: "text/plain" }))).toBeNull();
    expect(previewKind(node({ mime: "video/mp4" }))).toBeNull();
    expect(previewKind(node({ mime: null }))).toBeNull();
  });
});

describe("isPreviewable", () => {
  it("suit previewKind", () => {
    expect(isPreviewable(node({ mime: "image/png" }))).toBe(true);
    expect(isPreviewable(node({ mime: "application/pdf" }))).toBe(true);
    expect(isPreviewable(node({ mime: "application/zip" }))).toBe(false);
  });
});
