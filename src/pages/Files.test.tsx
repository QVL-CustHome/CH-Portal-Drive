import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Files from "./Files";
import { makeNode, renderWithProviders, useGridView, useListView } from "../test/harness";
import * as drive from "../api/drive";

vi.mock("../api/drive", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/drive")>();
  return {
    ...actual,
    listNodes: vi.fn(),
    listTrash: vi.fn(),
    searchNodes: vi.fn(),
    uploadFile: vi.fn(),
    createFolder: vi.fn(),
    moveNode: vi.fn(),
    trashNode: vi.fn(),
    restoreNode: vi.fn(),
    purgeNode: vi.fn(),
    emptyTrash: vi.fn(),
  };
});

const listNodes = vi.mocked(drive.listNodes);
const listTrash = vi.mocked(drive.listTrash);
const searchNodes = vi.mocked(drive.searchNodes);
const uploadFile = vi.mocked(drive.uploadFile);

const folderA = makeNode({ id: "folderA", name: "Dossier A", kind: "folder" });
const rootImage = makeNode({
  id: "fileB",
  name: "photo.png",
  kind: "file",
  size_bytes: 2048,
  is_media: true,
  media_type: "image",
});
const childFile = makeNode({
  id: "fileC",
  name: "notes.txt",
  kind: "file",
  parent_id: "folderA",
  size_bytes: 10,
});

const ROOT_RESPONSE = {
  parent_id: "root",
  ancestors: [{ id: "root", name: "root" }],
  items: [folderA, rootImage],
};

const FOLDER_A_RESPONSE = {
  parent_id: "folderA",
  ancestors: [
    { id: "root", name: "root" },
    { id: "folderA", name: "Dossier A" },
  ],
  items: [childFile],
};

const DROP_OVERLAY = "Déposez vos fichiers pour les importer";

function externalFilesTransfer(files: File[] = []) {
  return { dataTransfer: { files, types: ["Files"] } };
}

function internalRowTransfer() {
  return { dataTransfer: { files: [], types: ["text/plain"] } };
}

beforeEach(() => {
  vi.clearAllMocks();
  listNodes.mockImplementation((parentId?: string | null) =>
    Promise.resolve(parentId === "folderA" ? FOLDER_A_RESPONSE : ROOT_RESPONSE)
  );
  listTrash.mockResolvedValue([]);
  searchNodes.mockResolvedValue([]);
  uploadFile.mockResolvedValue(makeNode({ id: "up", name: "up.bin", kind: "file" }));
});

describe("Navigation fichiers et dossiers", () => {
  it("ouvre un dossier et affiche son contenu en vue grille", async () => {
    useGridView();
    renderWithProviders(<Files />);

    const folderCard = await screen.findByRole("button", { name: "Dossier A" });
    await userEvent.click(folderCard);

    expect(await screen.findByText("notes.txt")).toBeInTheDocument();
    expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
    expect(listNodes).toHaveBeenCalledWith("folderA");
  });
});

describe("Fil d'ariane", () => {
  it("affiche le fil d'ariane et revient à la racine au clic", async () => {
    useGridView();
    renderWithProviders(<Files />);

    const folderCard = await screen.findByRole("button", { name: "Dossier A" });
    await userEvent.click(folderCard);
    await screen.findByText("notes.txt");

    const breadcrumb = screen.getByRole("navigation", { name: "Fil d'Ariane" });
    const rootCrumb = within(breadcrumb).getByRole("button", { name: /Racine/ });
    await userEvent.click(rootCrumb);

    expect(await screen.findByText("photo.png")).toBeInTheDocument();
    expect(screen.queryByText("notes.txt")).not.toBeInTheDocument();
  });
});

describe("Sélection multiple", () => {
  it("sélectionne plusieurs éléments et affiche la barre de sélection", async () => {
    useGridView();
    renderWithProviders(<Files />);

    await screen.findByText("Dossier A");
    const checkboxes = screen.getAllByRole("checkbox", { name: "Sélectionner le fichier" });
    expect(checkboxes).toHaveLength(2);

    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[1]);

    const bar = document.querySelector("[data-selection-bar]") as HTMLElement;
    expect(bar).toBeInTheDocument();
    expect(within(bar).getByText("2 sélectionné(s)")).toBeInTheDocument();
  });

  it("vide la sélection via le bouton effacer", async () => {
    useGridView();
    renderWithProviders(<Files />);

    await screen.findByText("Dossier A");
    const checkboxes = screen.getAllByRole("checkbox", { name: "Sélectionner le fichier" });
    await userEvent.click(checkboxes[0]);

    const bar = document.querySelector("[data-selection-bar]") as HTMLElement;
    await userEvent.click(within(bar).getByRole("button", { name: /effacer|clear|désélectionner/i }));

    await waitFor(() =>
      expect(document.querySelector("[data-selection-bar]")).not.toBeInTheDocument()
    );
  });
});

describe("Dropzone en vue navigation", () => {
  it("affiche l'overlay au survol de fichiers externes en vue grille", async () => {
    useGridView();
    renderWithProviders(<Files />);
    await screen.findByText("Dossier A");

    const target = document.querySelector('[data-rowkey="fileB"]') as HTMLElement;
    fireEvent.dragEnter(target, externalFilesTransfer());

    expect(await screen.findByText(DROP_OVERLAY)).toBeInTheDocument();
  });

  it("affiche l'overlay et déclenche l'upload sur dépôt de fichiers externes en vue liste", async () => {
    useListView();
    renderWithProviders(<Files />);

    const nameCell = await screen.findByText("photo.png");
    fireEvent.dragEnter(nameCell, externalFilesTransfer());
    expect(await screen.findByText(DROP_OVERLAY)).toBeInTheDocument();

    const dropped = new File(["data"], "import.png", { type: "image/png" });
    fireEvent.drop(nameCell, externalFilesTransfer([dropped]));

    await waitFor(() => expect(uploadFile).toHaveBeenCalledWith(dropped, "root"));
  });

  it("n'affiche pas l'overlay lors d'un drag interne de ligne", async () => {
    useListView();
    renderWithProviders(<Files />);

    const nameCell = await screen.findByText("photo.png");
    fireEvent.dragEnter(nameCell, internalRowTransfer());

    expect(screen.queryByText(DROP_OVERLAY)).not.toBeInTheDocument();
  });
});

describe("Absence de Dropzone hors navigation", () => {
  it("n'affiche pas d'overlay d'import en vue corbeille", async () => {
    useListView();
    renderWithProviders(<Files trash />);

    const empty = await screen.findByText("La corbeille est vide.");
    fireEvent.dragEnter(empty, externalFilesTransfer());

    expect(screen.queryByText(DROP_OVERLAY)).not.toBeInTheDocument();
  });

  it("n'affiche pas d'overlay d'import en vue recherche", async () => {
    searchNodes.mockResolvedValue([makeNode({ id: "s1", name: "resultat.pdf", kind: "file" })]);
    useListView();
    renderWithProviders(<Files />);

    await screen.findByText("photo.png");
    const searchBox = screen.getByPlaceholderText("Nom de fichier ou dossier…");
    await userEvent.type(searchBox, "resultat");

    const result = await screen.findByText("resultat.pdf", {}, { timeout: 2000 });
    fireEvent.dragEnter(result, externalFilesTransfer());

    expect(screen.queryByText(DROP_OVERLAY)).not.toBeInTheDocument();
  });
});
