import { ViewTransition } from "react";

// Wraps a page's content so moving between pages is never a hard cut: the old
// page eases out and the new one rises in (React <ViewTransition> on top of
// the browser's View Transitions API; styles in globals.css). Browsers
// without that API get a simple fade-in instead (the .page class).
// Put this in each page.tsx, not the layout: layouts stay mounted across
// navigations, so their enter/exit never runs.
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div className="page">{children}</div>
    </ViewTransition>
  );
}
