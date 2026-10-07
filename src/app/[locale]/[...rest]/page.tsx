import { notFound } from "next/navigation";

// Any address under a language that matches no page (/en/whatever) shows the
// 404 page in that language (./not-found.tsx).
export default function CatchAll() {
  notFound();
}
