import { useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import {
  CardGrid,
  EmptyState,
  Feedback,
  Icon,
  Lightbox,
  PageContent,
  Spinner,
  Stack,
  useTranslation,
  type ChLightboxItem,
} from "canopui";
import GalleryTile from "../components/GalleryTile";
import { contentUrlFor, type Node } from "../api/drive";
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const groups = useMemo(() => groupByMonth(items, locale), [items, locale]);

  const lightboxItems = useMemo<ChLightboxItem[]>(
    () =>
      items.map((node) => ({
        src: contentUrlFor(node.id),
        kind: node.media_type === "video" ? "document" : "image",
        alt: node.name,
        title: node.name,
      })),
    [items]
  );

  return (
    <PageContent title={t("drive.gallery.title")}>
      <Stack gap="lg">
        {loadError && <Feedback severity="error">{loadError}</Feedback>}

        {loading ? (
          <Spinner label={t("drive.gallery.loading")} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t("drive.gallery.empty")}
            icon={<Icon name="image" size="xl" color="secondary" />}
          />
        ) : (
          groups.map((group) => (
            <Stack key={group.key} gap="sm">
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                {group.label}
              </Typography>
              <CardGrid minItemWidth="8rem" gap="sm">
                {group.items.map((node) => (
                  <GalleryTile
                    key={node.id}
                    node={node}
                    onOpen={() => setActiveIndex(items.findIndex((n) => n.id === node.id))}
                  />
                ))}
              </CardGrid>
            </Stack>
          ))
        )}
      </Stack>

      <Lightbox
        open={activeIndex !== null}
        onClose={() => setActiveIndex(null)}
        items={lightboxItems}
        index={activeIndex ?? 0}
        onIndexChange={setActiveIndex}
      />
    </PageContent>
  );
}
