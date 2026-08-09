import { Button, Input, SidePanel, Stack, useTranslation } from "canopui";
import PanelFooter from "./PanelFooter";

export interface RenamePanelProps {
  open: boolean;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

/** Renommage d'un élément. */
export default function RenamePanel({
  open,
  value,
  busy,
  onChange,
  onSubmit,
  onClose,
}: RenamePanelProps) {
  const { t } = useTranslation();

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={t("drive.files.rename.title")}
      footer={
        <PanelFooter>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t("drive.cancel")}
          </Button>
          <Button onClick={onSubmit} loading={busy} disabled={!value.trim()}>
            {t("drive.save")}
          </Button>
        </PanelFooter>
      }
    >
      <Stack
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <Input
          label={t("drive.files.nameLabel")}
          value={value}
          onChange={onChange}
          required
          autoFocus
        />
      </Stack>
    </SidePanel>
  );
}
