import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon, type ChIconName } from "@custhome/ui";

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
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    const left = Math.min(x, window.innerWidth - rect.width - margin);
    const top = Math.min(y, window.innerHeight - rect.height - margin);
    setPos({ left: Math.max(margin, left), top: Math.max(margin, top) });
  }, [x, y]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as globalThis.Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="drive-context-menu"
      role="menu"
      style={{ left: pos.left, top: pos.top }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className={`drive-context-item${item.danger ? " is-danger" : ""}`}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          <Icon name={item.icon} size={18} />
          {item.label}
        </button>
      ))}
    </div>
  );
}
