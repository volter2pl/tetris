import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lumen Tetris",
    short_name: "Lumen",
    description: "Neon-drenched Tetris that merges WebGL lightscapes with responsive audio.",
    start_url: "/",
    display: "standalone",
    background_color: "#020311",
    theme_color: "#030617",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/pwa-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
