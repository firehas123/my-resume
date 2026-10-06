import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server listens on the network (see "dev" in package.json).
  // Next.js blocks dev-only requests from other hosts unless they are listed
  // here, so this lets the Mac on the same Wi-Fi open http://192.168.0.67:3000.
  allowedDevOrigins: ["192.168.0.67"],

  images: {
    // Next.js only serves the qualities listed here; anything else is quietly
    // lowered to the nearest one. 75 is the default for most images; 92 keeps
    // the About photo sharp.
    qualities: [75, 92],
  },
};

export default nextConfig;
