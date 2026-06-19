import { Icon, Menu, MenuItem, type ChIconName } from "@custhome/ui";

export interface ContextMenuItem {
  icon: ChIconName;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  return (
    <Menu open onClose={onClose} position={{ top: y, left: x }}>
      {items.map((item) => (
        <MenuItem
          key={item.label}
          label={item.label}
          danger={item.danger}
          icon={<Icon name={item.icon} size="sm" />}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        />
      ))}
    </Menu>
  );
}
