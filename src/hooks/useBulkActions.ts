import { useCallback, useState } from "react";
import type { Node } from "../api/drive";
import type { useFiles } from "./useFiles";

interface Params {
  files: ReturnType<typeof useFiles>;
  selectedIds: string[];
  selectedNodes: Node[];
  clearSelection: () => void;
}

export interface BulkActions {
  /** Nœuds en cours de déplacement, `null` quand le panneau est fermé. */
  moving: Node[] | null;
  confirmPurge: boolean;
  setConfirmPurge: (open: boolean) => void;
  openMove: (node: Node) => void;
  moveSelection: () => void;
  closeMove: () => void;
  confirmMove: (target: string) => Promise<void>;
  trashSelection: () => Promise<void>;
  restoreSelection: () => Promise<void>;
  purgeSelection: () => Promise<void>;
}

/**
 * Actions portant sur la sélection courante.
 *
 * Chacune ne vide la sélection qu'en cas de succès : un échec doit laisser
 * l'utilisateur devant ce qu'il avait choisi, prêt à réessayer.
 */
export function useBulkActions({
  files,
  selectedIds,
  selectedNodes,
  clearSelection,
}: Params): BulkActions {
  const [moving, setMoving] = useState<Node[] | null>(null);
  const [confirmPurge, setConfirmPurge] = useState(false);

  const trashSelection = useCallback(async () => {
    if (await files.trashMany(selectedIds)) clearSelection();
  }, [clearSelection, files, selectedIds]);

  const restoreSelection = useCallback(async () => {
    if (await files.restoreMany(selectedIds)) clearSelection();
  }, [clearSelection, files, selectedIds]);

  const purgeSelection = useCallback(async () => {
    if (await files.purgeMany(selectedIds)) clearSelection();
    setConfirmPurge(false);
  }, [clearSelection, files, selectedIds]);

  const confirmMove = useCallback(
    async (target: string) => {
      const ids = (moving ?? []).map((node) => node.id);
      if (await files.moveMany(ids, target)) {
        setMoving(null);
        clearSelection();
      }
    },
    [clearSelection, files, moving],
  );

  // Agir sur un élément déjà sélectionné vaut pour toute la sélection : c'est
  // ce à quoi on s'attend après en avoir coché plusieurs.
  const openMove = useCallback(
    (node: Node) => {
      const dansLaSelection = selectedIds.includes(node.id) && selectedNodes.length > 0;
      setMoving(dansLaSelection ? selectedNodes : [node]);
    },
    [selectedIds, selectedNodes],
  );

  const moveSelection = useCallback(() => setMoving(selectedNodes), [selectedNodes]);
  const closeMove = useCallback(() => setMoving(null), []);

  return {
    moving,
    confirmPurge,
    setConfirmPurge,
    openMove,
    moveSelection,
    closeMove,
    confirmMove,
    trashSelection,
    restoreSelection,
    purgeSelection,
  };
}
