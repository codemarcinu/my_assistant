import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { FontSizeProvider, useFontSize } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FoodSave AI - Centrum Dowodzenia AI",
  description: "Zaawansowany system wieloagentowy AI do zarządzania żywnością i przepisami",
};

function FontSizeBody({ children }: { children: React.ReactNode }) {
  const { fontSize } = useFontSize();
  let fontSizeValue = '16px';
  if (fontSize === 'small') fontSizeValue = '14px';
  if (fontSize === 'large') fontSizeValue = '20px';
  return <body style={{ fontSize: fontSizeValue }}>{children}</body>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <FontSizeProvider>
        <Providers>
          <FontSizeBody>{children}</FontSizeBody>
        </Providers>
      </FontSizeProvider>
    </html>
  );
}
