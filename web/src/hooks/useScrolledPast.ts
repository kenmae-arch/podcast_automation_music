import { useEffect, useState } from 'react';

/**
 * True once the referenced element has scrolled fully above the viewport.
 * Drives the sticky album bar — DESIGN.md §15「スクロール後」.
 *
 * The ref must point at a *tall* element (the hero), not a zero-height marker.
 * A zero-height sentinel is never intersecting, so jumping straight from above
 * it to below it — a deep link, a restored scroll position, an instant
 * scrollIntoView — produces no intersection change and therefore no callback,
 * leaving the bar stuck in its initial state. Observing the hero itself makes
 * every such jump a real transition, and the observer's initial callback
 * settles the state correctly on load.
 */
export function useScrolledPast(ref: React.RefObject<HTMLElement | null>): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Fully above the fold, not merely started scrolling.
        setPast(entry.boundingClientRect.bottom <= 0);
      },
      { threshold: [0, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return past;
}
