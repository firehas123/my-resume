import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { INTRO_TRAVEL_SCRIPT, IntroScreen } from "@/components/layout/IntroScreen";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { VisitTracker } from "@/components/analytics/VisitTracker";
import { LANGUAGES, isLocale, languageInfo } from "@/i18n/config";
import { fontClassNames } from "@/i18n/fonts";
import { isProductionDeployment, statsEnabled } from "@/lib/env";
import { profileFor } from "@/lib/profile";
import { alternates } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { PRE_PAINT_SCRIPT, THEME_COLORS } from "@/lib/theme";
import "../globals.css";

// Every language is built as static pages ahead of time.
export function generateStaticParams() {
  return LANGUAGES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const profile = profileFor(locale);
  const title = t("siteTitle", { name: profile.name });
  const description = t("description", { pitch: profile.intro.pitch, location: profile.location });
  return {
    metadataBase: siteUrl(),
    title: { default: title, template: `%s · ${profile.shortName}` },
    description,
    alternates: alternates("/", locale),
    // The preview image comes from ./opengraph-image.tsx (1200x630), per language.
    openGraph: { type: "website", title, description, locale: languageInfo(locale).intl.split("-u-")[0].replace("-", "_") },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const language = languageInfo(locale);
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    // lang and dir come from the language config (dir="rtl" mirrors the layout
    // for Arabic). data-theme="dark" is the server default; the pre-paint
    // script corrects it before the first paint. suppressHydrationWarning is
    // needed because that script changes attributes on <html> before React loads.
    <html
      lang={locale}
      dir={language.dir}
      data-theme="dark"
      data-script={language.script}
      className={fontClassNames(language.script)}
      suppressHydrationWarning
    >
      <head>
        {/* Browser bar colour; the pre-paint script and the theme switch
            keep it matching the active theme (see THEME_COLORS). */}
        <meta name="theme-color" content={THEME_COLORS.dark} />
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
      </head>
      <body>
        {/* Interface texts for client components; next-intl passes this page's messages on. */}
        <NextIntlClientProvider>
          <a href="#main" className="skip-link">
            {t("skipToContent")}
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
        </NextIntlClientProvider>
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
