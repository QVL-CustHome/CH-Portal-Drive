import { useEffect, useState } from "react";

interface UseTableSelectionParams {
  resetKey: unknown;
  excludeId?: string;
}

interface UseTableSelectionResult {
  selected: string[];
  setSelected: (ids: string[]) => void;
  selectedIds: string[];
  clearSelection: () => void;
}

export function useTableSelection({
  resetKey,
  excludeId,
}: UseTableSelectionParams): UseTableSelectionResult {
  const [selected, setSelected] = useState<string[]>([]);
  const selectedIds = excludeId ? selected.filter((id) => id !== excludeId) : selected;
  const clearSelection = () => setSelected([]);

  useEffect(() => {
    setSelected([]);
  }, [resetKey]);

  useEffect(() => {
    if (selectedIds.length === 0) return;
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (
        target.closest(
          "[data-rowkey], thead, .drive-selbar, .MuiModal-root, .MuiPopover-root"
        )
      )
        return;
      setSelected([]);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [selectedIds.length]);

  return { selected, setSelected, selectedIds, clearSelection };
}
