import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { FontSizeProvider, FontSizeWrapper } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="pl" suppressHydrationWarning>
      <FontSizeProvider>
        <Providers>
          <body>
            <FontSizeWrapper>
              {children}
            </FontSizeWrapper>
          </body>
        </Providers>
      </FontSizeProvider>
    </html>
  );
}
