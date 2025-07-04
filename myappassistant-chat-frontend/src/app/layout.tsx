import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoodSave AI - Centrum Dowodzenia AI",
  description: "Zaawansowany system wieloagentowy AI do zarządzania żywnością i przepisami",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>
        {children}
      </body>
    </html>
  );
}
