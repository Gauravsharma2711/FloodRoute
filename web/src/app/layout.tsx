import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./output.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FloodRoute · Mumbai Flood-Aware Ambulance Routing",
  description:
    "Prototype decision support for Mumbai ambulance dispatchers and drivers during heavy rain. Avoids likely-to-flood roads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-[#111827]">{children}</body>
    </html>
  );
}
