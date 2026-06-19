import { useEffect, useRef, useState } from "react";

function isFileDrag(e: DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes("Files");
}

export function useWindowFileDrop(
  enabled: boolean,
  onDropFiles: (files: FileList) => void
): boolean {
  const [dragging, setDragging] = useState(false);
  const onDropFilesRef = useRef(onDropFiles);
  onDropFilesRef.current = onDropFiles;

  useEffect(() => {
    if (!enabled) return;
    const onOver = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      setDragging(true);
    };
    const onDrop = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer?.files;
      if (dropped && dropped.length > 0) onDropFilesRef.current(dropped);
    };
    const onLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) setDragging(false);
    };
    const onEnd = () => setDragging(false);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragend", onEnd);
    return () => {
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragend", onEnd);
    };
  }, [enabled]);

  return dragging;
}
