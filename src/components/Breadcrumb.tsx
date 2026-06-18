import { Fragment, useState } from "react";
import type { Crumb } from "../api/drive";

interface BreadcrumbProps {
  crumbs: Crumb[];
  rootLabel: string;
  onNavigate: (id: string) => void;
  onDropNode?: (crumbId: string, draggedKey: string) => void;
}

export default function Breadcrumb({ crumbs, rootLabel, onNavigate, onDropNode }: BreadcrumbProps) {
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  return (
    <nav className="drive-breadcrumb" aria-label={rootLabel}>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const label = index === 0 ? rootLabel : crumb.name;
        const dropProps = onDropNode
          ? {
              onDragOver: (e: React.DragEvent) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move" as const;
                if (dropTarget !== crumb.id) setDropTarget(crumb.id);
              },
              onDragLeave: () => setDropTarget((c) => (c === crumb.id ? null : c)),
              onDrop: (e: React.DragEvent) => {
                e.preventDefault();
                const draggedKey = e.dataTransfer.getData("text/plain");
                setDropTarget(null);
                if (draggedKey && draggedKey !== crumb.id) onDropNode(crumb.id, draggedKey);
              },
            }
          : {};
        const dropClass = dropTarget === crumb.id ? " drive-breadcrumb-dropover" : "";
        return (
          <Fragment key={crumb.id}>
            {index > 0 && <span className="drive-breadcrumb-sep">/</span>}
            {isLast ? (
              <span className={`drive-breadcrumb-current${dropClass}`} {...dropProps}>
                {label}
              </span>
            ) : (
              <button
                type="button"
                className={`drive-breadcrumb-link${dropClass}`}
                onClick={() => onNavigate(crumb.id)}
                {...dropProps}
              >
                {label}
              </button>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
