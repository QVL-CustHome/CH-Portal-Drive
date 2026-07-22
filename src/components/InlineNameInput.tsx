import InputBase from "@mui/material/InputBase";

interface InlineNameInputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

export default function InlineNameInput({
  value,
  placeholder,
  onChange,
  onCommit,
  onCancel,
}: InlineNameInputProps) {
  return (
    <InputBase
      autoFocus
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          onCommit();
        } else if (event.key === "Escape") {
          onCancel();
        }
      }}
      onBlur={onCommit}
      sx={{
        flex: 1,
        minWidth: "8rem",
        paddingX: "0.5rem",
        paddingY: "0.3rem",
        borderRadius: "var(--ch-radius-sm)",
        border: "0.0625rem solid var(--ch-palette-primary-main)",
        color: "text.primary",
        backgroundColor: "background.paper",
        font: "inherit",
        "& .MuiInputBase-input": { padding: 0 },
        "&.Mui-focused": {
          boxShadow: "0 0 0 0.125rem var(--ch-palette-primary-main)",
        },
      }}
    />
  );
}
