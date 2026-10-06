import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { IntroScreen } from "@/components/layout/IntroScreen";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { profile } from "@/lib/profile";
import { siteUrl } from "@/lib/site";
import { PRE_PAINT_SCRIPT } from "@/lib/theme";
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
  openGraph: {
    type: "website",
    title: `${profile.name} · Software engineer`,
    description,
    images: [{ url: profile.previewImage, width: 1200, height: 1200, alt: profile.name }],
  },
  twitter: {
    card: "summary",
    title: `${profile.name} · Software engineer`,
    description,
    images: [profile.previewImage],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#F7F7F8" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme="dark" is the server default; the pre-paint script corrects it
    // before the first paint. suppressHydrationWarning is needed because that
    // script changes attributes on <html> before React loads.
    <html lang="en" data-theme="dark" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <IntroScreen />
        <MotionProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
