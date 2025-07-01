import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { FontSizeProvider, FontSizeWrapper } from "@/components/providers";
import { EmotionRegistry } from "@/components/EmotionRegistry";
import { Toaster } from "sonner";

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
    <>
      <FontSizeProvider>
        <EmotionRegistry>
          <Providers>
            <FontSizeWrapper>
              {children}
            </FontSizeWrapper>
            <Toaster position="top-right" richColors />
          </Providers>
        </EmotionRegistry>
      </FontSizeProvider>
    </>
  );
}
