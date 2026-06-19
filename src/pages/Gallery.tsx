import { useMemo, useState } from "react";
import { Feedback, Heading, Icon, PageContent, Spinner, Stack, useTranslation } from "@custhome/ui";
import Lightbox from "../components/Lightbox";
import { thumbnailUrl, type Node } from "../api/drive";
import { useGallery } from "../hooks/useGallery";
import { formatMonth } from "../lib/format";

interface MonthGroup {
  key: string;
  label: string;
  items: Node[];
}

function groupByMonth(items: Node[], locale: string): MonthGroup[] {
  const groups: MonthGroup[] = [];
  const index = new Map<string, MonthGroup>();
  for (const item of items) {
    const iso = item.taken_at ?? item.created_at;
    const date = new Date(iso);
    const key = Number.isNaN(date.getTime())
      ? "unknown"
      : `${date.getFullYear()}-${date.getMonth()}`;
    let group = index.get(key);
    if (!group) {
      group = { key, label: formatMonth(iso, locale), items: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

export default function Gallery() {
  const { t, locale } = useTranslation();
  const { items, loading, loadError } = useGallery();
  const [active, setActive] = useState<Node | null>(null);

  const groups = useMemo(() => groupByMonth(items, locale), [items, locale]);

  return (
    <PageContent hideUtilitiesOnMobile fillHeight>
      <Stack gap="lg">
        <Heading level={1} size={3}>
          {t("drive.gallery.title")}
        </Heading>

        {loadError && <Feedback severity="error">{loadError}</Feedback>}

        {loading ? (
          <Spinner label={t("drive.gallery.loading")} />
        ) : items.length === 0 ? (
          <Feedback severity="info">{t("drive.gallery.empty")}</Feedback>
        ) : (
          groups.map((group) => (
            <section key={group.key} className="drive-gallery-section">
              <h2 className="drive-gallery-month">{group.label}</h2>
              <div className="drive-gallery-grid">
                {group.items.map((node) => (
                  <button
                    type="button"
                    key={node.id}
                    className="drive-gallery-tile"
                    onClick={() => setActive(node)}
                    title={node.name}
                  >
                    {node.has_thumbnail ? (
                      <img
                        className="drive-gallery-thumb"
                        src={thumbnailUrl(node.id)}
                        alt={node.name}
                        loading="lazy"
                      />
                    ) : (
                      <span className="drive-gallery-placeholder">
                        <Icon name={node.media_type === "video" ? "image" : "file"} size="lg" />
                      </span>
                    )}
                    {node.media_type === "video" && (
                      <span className="drive-gallery-badge" aria-hidden="true">
                        ▶
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </Stack>

      {active && <Lightbox node={active} onClose={() => setActive(null)} />}
    </PageContent>
  );
}
