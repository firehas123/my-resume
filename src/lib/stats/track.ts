import { EVENTS, type TrackEvent } from "./config";

/** The click name for a profile link id, if that link's clicks are counted. */
export function trackName(linkId: string): TrackEvent | undefined {
  return (EVENTS as readonly string[]).includes(linkId) ? (linkId as TrackEvent) : undefined;
}
