import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MovePanel from "./MovePanel";
import * as drive from "../api/drive";
import { makeNode, renderWithProviders } from "../test/harness";

vi.mock("../api/drive", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/drive")>();
  return { ...actual, listNodes: vi.fn() };
});

const listNodes = vi.mocked(drive.listNodes);

beforeEach(() => {
  listNodes.mockResolvedValue({
    parent_id: "root",
    ancestors: [{ id: "root", name: "root" }],
    items: [makeNode({ id: "f1", name: "Archives", kind: "folder" })],
  });
});

describe("MovePanel", () => {
  it("nomme le fil d'Ariane Déplacer vers", async () => {
    renderWithProviders(
      <MovePanel
        open
        moving={[makeNode({ id: "n1", name: "notes.txt", kind: "file" })]}
        busy={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(await screen.findByRole("navigation", { name: "Déplacer vers" })).toHaveAttribute(
      "aria-label",
      "Déplacer vers",
    );
  });
});
