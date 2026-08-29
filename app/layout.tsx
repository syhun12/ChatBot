import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DMA Assistant",
  description: "Dynamic Mooring & Anchoring AI Assistant",
  icons: {
    icon: "/dma-icon.svg",
    shortcut: "/dma-icon.svg",
    apple: "/dma-icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
