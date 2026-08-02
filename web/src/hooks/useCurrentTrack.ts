import { useEffect, useState } from 'react';

/**
 * Which track the reader is currently on — DESIGN.md §16「現在位置」:
 * 「Intersection Observerで最も表示面積の大きい行を現在位置とする」.
 *
 * The observer is used as the trigger only; geometry for all rows is recomputed
 * on each callback. Reading 21 rects inside an already-throttled observer
 * callback is far cheaper than a scroll listener (DESIGN.md §27), and it avoids
 * the stale-area problem you get from caching per-entry ratios — a row that
 * stays partially visible without crossing a threshold never reports again.
 *
 * Several rows are often equally visible at once, so ties break toward the row
 * nearest the viewport's vertical centre, which is what the reader is actually
 * looking at.
 *
 * Deliberately never rewrites the URL (「スクロール中にURLを書き換えない」) and has
 * no connection to playback — this page plays nothing.
 */
export interface CurrentTrack {
  /** Last known position. Retained when the list scrolls out of view. */
  current: number;
  /** Whether a track row is on screen right now. */
  inJourney: boolean;
}

export function useCurrentTrack(trackCount: number): CurrentTrack {
  const [current, setCurrent] = useState(1);
  const [inJourney, setInJourney] = useState(false);

  useEffect(() => {
    const rows = Array.from(
      document.querySelectorAll<HTMLElement>('[data-track-number]'),
    );
    if (!rows.length) return;

    const measure = () => {
      const viewportHeight = window.innerHeight;
      const viewportCentre = viewportHeight / 2;

      let best = 0;
      let bestArea = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const row of rows) {
        const n = Number(row.getAttribute('data-track-number'));
        if (!n) continue;

        const rect = row.getBoundingClientRect();
        const visible =
          Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
        if (visible <= 0) continue;

        const distance = Math.abs(rect.top + rect.height / 2 - viewportCentre);

        // Round to the pixel so near-identical areas count as a tie.
        const area = Math.round(visible);
        if (area > bestArea || (area === bestArea && distance < bestDistance)) {
          bestArea = area;
          bestDistance = distance;
          best = n;
        }
      }

      setInJourney(best !== 0);
      // Keep the last position when the list leaves the viewport, so scrolling
      // back into it doesn't flash a reset value.
      if (best) setCurrent((prev) => (prev === best ? prev : best));
    };

    const observer = new IntersectionObserver(measure, {
      threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1],
    });
    rows.forEach((row) => observer.observe(row));

    // Resizing changes which row dominates without any intersection change.
    window.addEventListener('resize', measure, { passive: true });
    measure();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [trackCount]);

  return { current, inJourney };
}
