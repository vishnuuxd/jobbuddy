import type { Metadata } from "next";
import { Kit } from "./Kit";

export const metadata: Metadata = { title: "JobBuddy kit", robots: { index: false } };

export default function KitPage() {
  return <Kit />;
}
