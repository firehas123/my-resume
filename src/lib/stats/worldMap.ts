// Builds the world map for the stats page as plain SVG path strings, once,
// on the server at build time. The browser only receives the shapes; no
// mapping library is shipped to it.
//
// Data: Natural Earth 1:110m countries from the "world-atlas" package (ISC),
// projected with d3-geo's Equal Earth projection, country codes from
// "i18n-iso-countries" (MIT).

import { geoEqualEarth, geoPath } from "d3-geo";
import countries from "i18n-iso-countries";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";

export type MapShape = { code: string | null; d: string };
export type WorldMap = { width: number; height: number; shapes: MapShape[] };

const WIDTH = 960;
const HEIGHT = 470;
// Shapes without a numeric ISO code in the data set.
const CODES_BY_NAME: Record<string, string> = { Kosovo: "XK" };

export function buildWorldMap(): WorldMap {
  const topology = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
  const collection = feature(topology, topology.objects.countries);
  // Antarctica takes a lot of space and never has visitors.
  const features = collection.features.filter((f) => f.id !== "010");
  const projection = geoEqualEarth().fitSize([WIDTH, HEIGHT], { type: "FeatureCollection", features });
  // Whole-pixel coordinates: invisible at this size, and much less data.
  const path = geoPath(projection).digits(0);
  const shapes = features
    .map((f) => ({
      code: (f.id ? countries.numericToAlpha2(String(f.id)) : CODES_BY_NAME[f.properties?.name ?? ""]) ?? null,
      d: path(f) ?? "",
    }))
    .filter((s) => s.d);
  return { width: WIDTH, height: HEIGHT, shapes };
}
