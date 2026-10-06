import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { INTRO_TRAVEL_SCRIPT, IntroScreen } from "@/components/layout/IntroScreen";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { VisitTracker } from "@/components/analytics/VisitTracker";
import { isProductionDeployment, statsEnabled } from "@/lib/env";
import { profile } from "@/lib/profile";
import { siteUrl } from "@/lib/site";
import { PRE_PAINT_SCRIPT, THEME_COLORS } from "@/lib/theme";
import "./globals.css";

// One font family for the whole site. Next downloads it at build time and
// serves it from this domain, so visitors never contact Google.
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const description = `${profile.intro.pitch} Based in ${profile.location}.`;

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: `${profile.name} · Software engineer`,
    template: `%s · ${profile.shortName}`,
  },
  description,
  // The preview image comes from src/app/opengraph-image.tsx (1200x630).
  openGraph: {
    type: "website",
    title: `${profile.name} · Software engineer`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} · Software engineer`,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme="dark" is the server default; the pre-paint script corrects it
    // before the first paint. suppressHydrationWarning is needed because that
    // script changes attributes on <html> before React loads.
    <html lang="en" data-theme="dark" className={manrope.variable} suppressHydrationWarning>
      <head>
        {/* Browser bar colour; the pre-paint script and the theme switch
            keep it matching the active theme (see THEME_COLORS). */}
        <meta name="theme-color" content={THEME_COLORS.dark} />
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <IntroScreen />
        <MotionProvider>
          <Header />
          {/* Measures where the intro logo should land (see IntroScreen). */}
          <script dangerouslySetInnerHTML={{ __html: INTRO_TRAVEL_SCRIPT }} />
          <main id="main">{children}</main>
          <Footer />
        </MotionProvider>
        {/* The site's own privacy-friendly visit counter (production only). */}
        <VisitTracker enabled={statsEnabled} />
        {/* Vercel Web Analytics and Speed Insights: only on the production
            deployment, never in previews or local development. */}
        {isProductionDeployment && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
