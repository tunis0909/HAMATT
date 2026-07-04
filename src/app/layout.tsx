import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "HAMA - Game Tracker | تتبع الألعاب",
  description: "تتبع أحدث الألعاب القادمة والمنزلة مع روابط التحميل. Track upcoming and released games with download links.",
  keywords: "games, gaming, upcoming games, released games, GTA 6, game tracker, HAMA",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-dark-bg text-dark-text antialiased min-h-screen" style={{ fontFamily: "'Tajawal', 'Inter', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
