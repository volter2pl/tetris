import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@fontsource/space-grotesk/latin-300.css";
import "@fontsource/space-grotesk/latin-400.css";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/space-grotesk/latin-600.css";
import "@fontsource/space-grotesk/latin-700.css";
import "@fontsource/chakra-petch/latin-400.css";
import "@fontsource/chakra-petch/latin-500.css";
import "@fontsource/chakra-petch/latin-600.css";
import "@fontsource/chakra-petch/latin-700.css";

export const metadata: Metadata = {
  title: "Lumen Tetris",
  description: "A cinematic WebGL Tetris experience forged with light, motion and sound.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://lumen-tetris.app"),
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: "#030617",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
