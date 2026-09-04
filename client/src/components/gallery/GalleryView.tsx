import { useEffect, useState } from "react";
import { PolaroidFrame } from "@/components/layout/PolaroidFrame";
import { formatPrintDate } from "@/lib/format-date";
import { listPrints } from "@/lib/film-roll";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { FILM_CAPACITY } from "@/types";
import type { FilmPrint } from "@/types";

const galleryDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatGalleryLabel(createdAt: string): string {
  return `View print from ${galleryDateFormatter.format(new Date(createdAt))}`;
}

interface GalleryViewProps {
  onSelect: (print: FilmPrint) => void;
  remainingExposures: number;
  rollVersion: number;
}

function GalleryThumbnail({
  print,
  onSelect,
}: {
  print: FilmPrint;
  onSelect: (print: FilmPrint) => void;
}) {
  const objectUrl = useObjectUrl(print.outputBlob);
  if (!objectUrl) return null;

  return (
    <button
      type="button"
      aria-label={formatGalleryLabel(print.createdAt)}
      onClick={() => onSelect(print)}
      className="mb-3 block w-full break-inside-avoid transition-transform active:scale-[0.98]"
    >
      <PolaroidFrame
        aspectRatio={print.aspectRatio || 1}
        caption={formatPrintDate(print.createdAt)}
        compact
        className="max-w-none pointer-events-none"
      >
        <img
          src={objectUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
      </PolaroidFrame>
    </button>
  );
}

export function GalleryView({ onSelect, remainingExposures, rollVersion }: GalleryViewProps) {
  const [items, setItems] = useState<FilmPrint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setItems([]);

    void listPrints()
      .then((prints) => {
        if (cancelled) return;
        setItems(prints);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load gallery");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rollVersion]);

  const used = FILM_CAPACITY - remainingExposures;
  const exposureCaption =
    used === 0
      ? `${remainingExposures} of ${FILM_CAPACITY} exposures remaining`
      : `${used} of ${FILM_CAPACITY} exposures used · ${remainingExposures} left`;

  if (loading) {
    return (
      <div className="w-full space-y-3">
        <p className="text-center text-sm text-muted-foreground">{exposureCaption}</p>
        <p className="text-sm text-muted-foreground">Loading your developed prints…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-3">
        <p className="text-center text-sm text-muted-foreground">{exposureCaption}</p>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full space-y-3">
        <p className="text-center text-sm text-muted-foreground">{exposureCaption}</p>
        <div className="rounded-2xl border border-dashed border-border bg-card/80 p-8 text-center">
          <p className="font-heading text-lg font-semibold tracking-wide text-foreground uppercase">
            No prints yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Capture a photo to start your roll.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <p className="text-center text-sm text-muted-foreground">{exposureCaption}</p>
      <div className="columns-2 gap-3 [column-fill:balance]">
        {items.map((item) => (
          <GalleryThumbnail key={item.id} print={item} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
