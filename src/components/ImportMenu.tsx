import { Icon, Menu, MenuItem, useTranslation } from "canopui";

interface ImportMenuProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onPickFiles: () => void;
  onPickFolder: () => void;
}

export default function ImportMenu({
  open,
  anchorEl,
  onClose,
  onPickFiles,
  onPickFolder,
}: ImportMenuProps) {
  const { t } = useTranslation();

  return (
    <Menu open={open} anchorEl={anchorEl} onClose={onClose}>
      <MenuItem
        label={t("drive.files.import.files")}
        icon={<Icon name="file" size="sm" />}
        onClick={onPickFiles}
      />
      <MenuItem
        label={t("drive.files.import.folder")}
        icon={<Icon name="folder" size="sm" />}
        onClick={onPickFolder}
      />
    </Menu>
  );
}
