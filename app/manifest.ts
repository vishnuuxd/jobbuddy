import type { MetadataRoute } from "next";

// Installable as an app (PRD: Screens). Opens full screen from the home screen icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JobBuddy",
    short_name: "JobBuddy",
    description: "Mock interviews with Meera.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b051d",
    theme_color: "#0b051d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
