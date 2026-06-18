import { useEffect, useRef } from "react";
import { Icon, useTranslation } from "@custhome/ui";

interface ImportMenuProps {
  open: boolean;
  onClose: () => void;
  onPickFiles: () => void;
  onPickFolder: () => void;
}

export default function ImportMenu({ open, onClose, onPickFiles, onPickFolder }: ImportMenuProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as globalThis.Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={ref} className="drive-import-menu" role="menu">
      <button type="button" className="drive-import-option" role="menuitem" onClick={onPickFiles}>
        <Icon name="file" size={18} />
        {t("drive.files.import.files")}
      </button>
      <button type="button" className="drive-import-option" role="menuitem" onClick={onPickFolder}>
        <Icon name="folder" size={18} />
        {t("drive.files.import.folder")}
      </button>
    </div>
  );
}
