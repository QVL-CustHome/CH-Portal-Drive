import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@custhome/ui";
import { listGallery, type Node } from "../api/drive";

export function useGallery() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listGallery());
      setLoadError(null);
    } catch {
      setLoadError(t("drive.gallery.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, loadError, reload };
}
