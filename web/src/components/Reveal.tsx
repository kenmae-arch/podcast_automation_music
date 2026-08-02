import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Position within its group; stagger is 60ms, capped at 5 — DESIGN.md §23. */
  index?: number;
  as?: 'div' | 'li' | 'section' | 'article';
  className?: string;
}

/**
 * Scroll reveal per DESIGN.md §23: opacity 0→1 with a 16px rise over 520ms.
 * Once shown it stays shown 「一度表示した要素をスクロールアウトのたびに隠さない」.
 * Content is present in the DOM regardless, so disabling motion or JS loses
 * nothing (DESIGN.md §31-9).
 */
export function Reveal({ children, index = 0, as: Tag = 'div', className }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No observer support ⇒ show everything rather than leave it hidden.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={['reveal', visible ? 'is-visible' : '', className].filter(Boolean).join(' ')}
      style={{ '--reveal-delay': `${Math.min(index, 4) * 60}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
