import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // The dev server listens on the network (see "dev" in package.json).
  // Next.js blocks dev-only requests from other hosts unless they are listed
  // here, so this lets the Mac on the same Wi-Fi open http://192.168.0.67:3000.
  allowedDevOrigins: ["192.168.0.67"],

  // Keep the server functions small (Vercel counts their size as storage).
  // Image resizing runs on Vercel's image service, not inside the functions.
  outputFileTracingExcludes: {
    "/**": ["node_modules/sharp/**", "node_modules/@img/**"],
  },

  images: {
    // Next.js only serves the qualities listed here; anything else is quietly
    // lowered to the nearest one. 75 is the default for most images; 92 keeps
    // the About photo sharp.
    qualities: [75, 92],
  },

  // The skill logos are static files whose URLs have no content hash, so they
  // get a week of caching rather than the default of none.
  async headers() {
    return [
      {
        source: "/skill-icons/:file*",
        headers: [
          { key: "Content-Type", value: "image/svg+xml; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=604800" },
        ],
      },
    ];
  },

  // Old addresses from before the site had languages keep working. (Pages
  // without a language, like /contact, are redirected by src/proxy.ts.)
  async redirects() {
    return [
      // The legal pages were German only.
      { source: "/impressum", destination: "/de/impressum", permanent: true },
      { source: "/datenschutz", destination: "/de/datenschutz", permanent: true },
      // The single English CV is now one CV per language.
      { source: "/files/resume.pdf", destination: "/files/cv-en.pdf", permanent: true },
    ];
  },
};

// next-intl finds its request config in src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl(nextConfig);
