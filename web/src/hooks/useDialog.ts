import { useCallback, useEffect, useRef, useState } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal plumbing for the platform sheet — DESIGN.md §19 / §26:
 * focus moves in on open, is trapped while open, Escape closes, background
 * scroll stops, and focus returns to the control that opened it.
 */
export function useDialog() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const openDialog = useCallback((event?: { currentTarget: EventTarget | null }) => {
    openerRef.current = (event?.currentTarget as HTMLElement) ?? null;
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => setOpen(false), []);

  // Move focus in, and hand it back to the opener on close.
  useEffect(() => {
    if (!open) {
      openerRef.current?.focus?.();
      return;
    }
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();
  }, [open]);

  // Escape to close, Tab cycles within the panel.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeDialog();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, closeDialog]);

  // Hold the page still behind the sheet, compensating for the scrollbar so the
  // layout doesn't jump (CLS — DESIGN.md §27).
  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;

    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [open]);

  return { open, openDialog, closeDialog, panelRef };
}
