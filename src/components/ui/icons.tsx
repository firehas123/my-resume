// Small line icons, all drawn on a 24px grid with the same 2px stroke so they
// look like one family. They are functional only (never decoration) and are
// hidden from screen readers; the button or link next to them carries the text.

type IconProps = { size?: number };

function Svg({ size = 20, children, className }: IconProps & { children: React.ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** `nudge`: the arrow moves down a little when its button is hovered (CSS). */
export function DownloadIcon({ nudge, ...props }: IconProps & { nudge?: boolean }) {
  return (
    <Svg {...props}>
      <g className={nudge ? "nudge-arrow" : undefined}>
        <path d="M12 4v11" />
        <path d="M7 11l5 5 5-5" />
      </g>
      <path d="M5 20h14" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </Svg>
  );
}

/** A simple globe: a circle with a meridian and the equator (the language menu). */
export function GlobeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z" />
    </Svg>
  );
}

/** Points back (left); turned around in right-to-left languages. */
export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props} className="flip-rtl">
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </Svg>
  );
}

/** Out of the page, toward the end of the line; turned around in right-to-left languages. */
export function ExternalIcon(props: IconProps) {
  return (
    <Svg {...props} className="flip-rtl">
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </Svg>
  );
}
