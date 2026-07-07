import { useEffect } from "react";
import { Icon, useTranslation } from "canopui";
import { contentUrlFor, type Node } from "../api/drive";

interface LightboxProps {
  node: Node;
  onClose: () => void;
}

export default function Lightbox({ node, onClose }: LightboxProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isVideo = node.media_type === "video";

  return (
    <div
      className="drive-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={node.name}
      onClick={onClose}
    >
      <button
        type="button"
        className="drive-lightbox-close"
        aria-label={t("drive.gallery.close")}
        onClick={onClose}
      >
        <Icon name="close" size="md" />
      </button>
      <div className="drive-lightbox-stage" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video className="drive-lightbox-media" src={contentUrlFor(node.id)} controls autoPlay />
        ) : (
          <img className="drive-lightbox-media" src={contentUrlFor(node.id)} alt={node.name} />
        )}
        <div className="drive-lightbox-caption">{node.name}</div>
      </div>
    </div>
  );
}
