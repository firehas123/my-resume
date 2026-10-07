import { LINK_EVENTS } from "./config";

/** The click name for a profile link id, if that link's clicks are counted. */
export function trackName(linkId: string): string | undefined {
  return (LINK_EVENTS as readonly string[]).includes(linkId) ? linkId : undefined;
}
