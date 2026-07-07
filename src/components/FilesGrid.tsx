import { useRef } from "react";
import { Checkbox, Icon, useTranslation, type ChIconName } from "canopui";
import type { Node } from "../api/drive";

interface FilesGridProps {
  items: Node[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onOpenFolder: (id: string) => void;
  onContextMenu: (node: Node, e: React.MouseEvent) => void;
  iconFor: (node: Node) => ChIconName;
  enableOpen: boolean;
  emptyMessage: string;
  adding?: boolean;
  draftName?: string;
  draftPlaceholder?: string;
  onDraftChange?: (value: string) => void;
  onCommitDraft?: () => void;
  onCancelDraft?: () => void;
}

export default function FilesGrid({
  items,
  selectedIds,
  onSelectionChange,
  onOpenFolder,
  onContextMenu,
  iconFor,
  enableOpen,
  emptyMessage,
  adding = false,
  draftName = "",
  draftPlaceholder,
  onDraftChange,
  onCommitDraft,
  onCancelDraft,
}: FilesGridProps) {
  const { t } = useTranslation();
  const anchor = useRef<string | null>(null);
  const clickTimer = useRef<number | null>(null);
  const selectedSet = new Set(selectedIds);
  const order = items.map((n) => n.id);
  const showCheck = selectedIds.length > 0;

  const applySelection = (e: React.MouseEvent, id: string) => {
    if (e.shiftKey && anchor.current) {
      const a = order.indexOf(anchor.current);
      const b = order.indexOf(id);
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a];
        const base = e.ctrlKey || e.metaKey ? new Set(selectedIds) : new Set<string>();
        order.slice(lo, hi + 1).forEach((k) => base.add(k));
        onSelectionChange([...base]);
      }
    } else if (e.ctrlKey || e.metaKey) {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange([...next]);
      anchor.current = id;
    } else {
      onSelectionChange([id]);
      anchor.current = id;
    }
  };

  const handleClick = (e: React.MouseEvent, node: Node) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, button, [data-no-select="true"]')) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      applySelection(e, node.id);
      return;
    }
    if (enableOpen && node.kind === "folder") {
      if (clickTimer.current) window.clearTimeout(clickTimer.current);
      clickTimer.current = window.setTimeout(() => {
        onSelectionChange([node.id]);
        anchor.current = node.id;
        clickTimer.current = null;
      }, 220);
    } else {
      onSelectionChange([node.id]);
      anchor.current = node.id;
    }
  };

  const handleDouble = (node: Node) => {
    if (enableOpen && node.kind === "folder") {
      if (clickTimer.current) {
        window.clearTimeout(clickTimer.current);
        clickTimer.current = null;
      }
      onOpenFolder(node.id);
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange([...next]);
    anchor.current = id;
  };

  return (
    <div className="drive-grid-scroll">
      {items.length === 0 && !adding ? (
        <div className="drive-grid-empty">{emptyMessage}</div>
      ) : (
        <div className="drive-grid">
          {adding && (
            <div className="drive-card is-draft">
              <div className="drive-card-body">
                <Icon name="folder" size="xl" color="secondary" />
                <input
                  className="drive-inline-input"
                  autoFocus
                  value={draftName}
                  placeholder={draftPlaceholder}
                  onChange={(e) => onDraftChange?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onCommitDraft?.();
                    } else if (e.key === "Escape") {
                      onCancelDraft?.();
                    }
                  }}
                  onBlur={() => onCommitDraft?.()}
                />
              </div>
            </div>
          )}
          {items.map((node) => {
            const selected = selectedSet.has(node.id);
            return (
              <div
                key={node.id}
                className={`drive-card${selected ? " is-selected" : ""}`}
                role="button"
                tabIndex={0}
                onClick={(e) => handleClick(e, node)}
                onDoubleClick={() => handleDouble(node)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onContextMenu(node, e);
                }}
              >
                <div className="drive-card-head">
                  {showCheck && (
                    <span className="drive-card-check" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected} onChange={() => toggle(node.id)} size="small" />
                    </span>
                  )}
                  <span className="drive-card-name">{node.name}</span>
                  <button
                    type="button"
                    className="drive-card-menu"
                    aria-label={t("drive.files.action.more")}
                    onClick={(e) => {
                      e.stopPropagation();
                      onContextMenu(node, e);
                    }}
                  >
                    <Icon name="more" size="sm" />
                  </button>
                </div>
                <div className="drive-card-body">
                  <Icon name={iconFor(node)} size="xl" color="secondary" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
