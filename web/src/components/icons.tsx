/**
 * Icon set — DESIGN.md §8: 24px grid, 1.5–2px strokes, round caps.
 * Scoped to what this page needs. There is deliberately no play/pause/seek
 * iconography: the site never plays audio, listening happens in the apps.
 */

interface IconProps {
  size?: number;
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

/** Marks a link that leaves the site — paired with wording, never used alone. */
export function ExternalIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export function CloseIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
