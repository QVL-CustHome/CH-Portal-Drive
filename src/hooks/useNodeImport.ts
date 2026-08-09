import { useCallback, useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";

interface Params {
  enqueue: (files: FileList | File[], parentId: string | null) => void;
  parentId: string | null;
}

export interface NodeImport {
  fileInput: RefObject<HTMLInputElement | null>;
  dirInput: RefObject<HTMLInputElement | null>;
  /** Élément sur lequel ancrer le menu d'import, `null` si fermé. */
  anchor: HTMLElement | null;
  openMenu: (event?: MouseEvent<HTMLElement>) => void;
  closeMenu: () => void;
  pickFiles: () => void;
  pickFolder: () => void;
  acceptFiles: (list: FileList | null) => void;
  acceptFolder: (list: FileList | null) => void;
}

/**
 * Choix des fichiers à envoyer, par sélection ou par import d'un dossier.
 *
 * Les deux champs sont remis à zéro après usage : sans cela, rechoisir le même
 * dossier ne déclencherait aucun événement et l'import semblerait ignoré.
 */
export function useNodeImport({ enqueue, parentId }: Params): NodeImport {
  const fileInput = useRef<HTMLInputElement>(null);
  const dirInput = useRef<HTMLInputElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  // L'import de dossier n'a pas d'attribut JSX standard : on le pose à la main.
  useEffect(() => {
    if (dirInput.current) {
      dirInput.current.setAttribute("webkitdirectory", "");
      dirInput.current.setAttribute("directory", "");
    }
  }, []);

  const closeMenu = useCallback(() => setAnchor(null), []);

  const openMenu = useCallback((event?: MouseEvent<HTMLElement>) => {
    setAnchor(event?.currentTarget ?? null);
  }, []);

  const pickFiles = useCallback(() => {
    closeMenu();
    fileInput.current?.click();
  }, [closeMenu]);

  const pickFolder = useCallback(() => {
    closeMenu();
    dirInput.current?.click();
  }, [closeMenu]);

  const acceptFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      enqueue(list, parentId);
      if (fileInput.current) fileInput.current.value = "";
    },
    [enqueue, parentId],
  );

  const acceptFolder = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      enqueue(list, parentId);
      if (dirInput.current) dirInput.current.value = "";
    },
    [enqueue, parentId],
  );

  return {
    fileInput,
    dirInput,
    anchor,
    openMenu,
    closeMenu,
    pickFiles,
    pickFolder,
    acceptFiles,
    acceptFolder,
  };
}
