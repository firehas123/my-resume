// Language-aware versions of Next's navigation helpers. Use these instead of
// next/link and next/navigation, so every link keeps the current language.

import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
