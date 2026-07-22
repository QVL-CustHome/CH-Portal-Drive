import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Gallery from "./Gallery";
import { makeNode, renderWithProviders } from "../test/harness";
import * as drive from "../api/drive";

vi.mock("../api/drive", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/drive")>();
  return {
    ...actual,
    listGallery: vi.fn(),
  };
});

const listGallery = vi.mocked(drive.listGallery);

const photo = makeNode({
  id: "p1",
  name: "vacances.jpg",
  kind: "file",
  is_media: true,
  media_type: "image",
  has_thumbnail: true,
});
const secondPhoto = makeNode({
  id: "p2",
  name: "montagne.jpg",
  kind: "file",
  is_media: true,
  media_type: "image",
  has_thumbnail: true,
});

beforeEach(() => {
  vi.clearAllMocks();
  listGallery.mockResolvedValue([photo, secondPhoto]);
});

describe("Aperçu Lightbox", () => {
  it("ouvre l'aperçu de la photo cliquée avec son titre", async () => {
    renderWithProviders(<Gallery />);

    const tile = await screen.findByRole("button", { name: "vacances.jpg" });
    await userEvent.click(tile);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("img", { name: "vacances.jpg" })).toBeInTheDocument();
    expect(within(dialog).getByText("vacances.jpg")).toBeInTheDocument();
    expect(within(dialog).getByText("1 / 2")).toBeInTheDocument();
  });

  it("ferme l'aperçu via le bouton de fermeture", async () => {
    renderWithProviders(<Gallery />);

    const tile = await screen.findByRole("button", { name: "vacances.jpg" });
    await userEvent.click(tile);

    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Fermer la visionneuse" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
