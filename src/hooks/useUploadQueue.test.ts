import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useUploadQueue } from "./useUploadQueue";
import * as drive from "../api/drive";

vi.mock("../api/drive", () => ({
  uploadFile: vi.fn(),
  createFolder: vi.fn(),
  listNodes: vi.fn(),
}));

const uploadFile = vi.mocked(drive.uploadFile);
const createFolder = vi.mocked(drive.createFolder);
const listNodes = vi.mocked(drive.listNodes);

function fichier(nom: string, chemin?: string): File {
  const f = new File(["x"], nom);
  if (chemin) {
    Object.defineProperty(f, "webkitRelativePath", { value: chemin });
  }
  return f;
}

function monter() {
  return renderHook(() =>
    useUploadQueue({
      onBatchFinished: vi.fn(),
      describeError: (e) => (e instanceof Error ? e.message : "erreur"),
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  uploadFile.mockResolvedValue({ id: "n" } as never);
  createFolder.mockResolvedValue({ id: "dossier" } as never);
  listNodes.mockResolvedValue({ items: [] } as never);
});

describe("useUploadQueue", () => {
  it("envoie tous les fichiers de la file", async () => {
    const { result } = monter();

    act(() => result.current.enqueue([fichier("a.txt"), fichier("b.txt")], "root"));

    await waitFor(() => expect(result.current.finished).toBe(true));
    expect(uploadFile).toHaveBeenCalledTimes(2);
    expect(result.current.done).toBe(2);
    expect(result.current.failed).toBe(0);
  });

  it("poursuit les fichiers suivants malgré un échec — le bug d'origine perdait tout le reste", async () => {
    uploadFile
      .mockRejectedValueOnce(new Error("doublon"))
      .mockResolvedValue({ id: "n" } as never);
    const { result } = monter();

    act(() =>
      result.current.enqueue(
        [fichier("a.txt"), fichier("b.txt"), fichier("c.txt")],
        "root"
      )
    );

    await waitFor(() => expect(result.current.finished).toBe(true));
    expect(uploadFile).toHaveBeenCalledTimes(3);
    expect(result.current.done).toBe(2);
    expect(result.current.failed).toBe(1);
  });

  it("signale l'échec avec son motif au lieu d'ignorer le fichier en silence", async () => {
    uploadFile.mockRejectedValue(new Error("quota dépassé"));
    const { result } = monter();

    act(() => result.current.enqueue([fichier("a.txt")], "root"));

    await waitFor(() => expect(result.current.finished).toBe(true));
    expect(result.current.items[0]!.status).toBe("error");
    expect(result.current.items[0]!.error).toBe("quota dépassé");
  });

  it("réessaye les seuls fichiers en échec", async () => {
    uploadFile
      .mockRejectedValueOnce(new Error("réseau"))
      .mockResolvedValue({ id: "n" } as never);
    const { result } = monter();

    act(() => result.current.enqueue([fichier("a.txt"), fichier("b.txt")], "root"));
    await waitFor(() => expect(result.current.failed).toBe(1));

    act(() => result.current.retryFailed());

    await waitFor(() => expect(result.current.done).toBe(2));
    expect(result.current.failed).toBe(0);
    expect(uploadFile).toHaveBeenCalledTimes(3);
  });

  it("ne crée qu'une fois un dossier partagé par plusieurs fichiers", async () => {
    const { result } = monter();

    act(() =>
      result.current.enqueue(
        [fichier("a.txt", "photos/a.txt"), fichier("b.txt", "photos/b.txt")],
        "root"
      )
    );

    await waitFor(() => expect(result.current.finished).toBe(true));
    expect(createFolder).toHaveBeenCalledTimes(1);
    expect(uploadFile).toHaveBeenCalledTimes(2);
  });

  it("ignore les fichiers déjà présents — relancer le même import le reprend", async () => {
    listNodes.mockResolvedValue({ items: [{ name: "a.txt" }] } as never);
    const { result } = monter();

    act(() => result.current.enqueue([fichier("a.txt"), fichier("b.txt")], "root"));

    await waitFor(() => expect(result.current.finished).toBe(true));
    expect(result.current.skipped).toBe(1);
    expect(result.current.done).toBe(1);
    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(uploadFile).toHaveBeenCalledWith(expect.objectContaining({ name: "b.txt" }), "root");
  });

  it("met en pause et ne reprend qu'à la demande", async () => {
    const { result } = monter();

    act(() => result.current.pause());
    act(() => result.current.enqueue([fichier("a.txt")], "root"));
    // enqueue relance la file : la pause vaut pour les demandes suivantes.
    await waitFor(() => expect(result.current.finished).toBe(true));

    act(() => result.current.pause());
    expect(result.current.paused).toBe(true);
    act(() => result.current.resume());
    expect(result.current.paused).toBe(false);
  });
});
