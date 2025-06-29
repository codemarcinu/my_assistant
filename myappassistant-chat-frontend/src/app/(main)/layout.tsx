"use client";

import { Layout } from "@/components/layout/Layout";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { PageLoader } from "@/components/layout/PageLoader";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <Layout>
      <PageLoader isLoading={isLoading} />
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35, ease: [0.4, 0.2, 0.6, 1] }}
          style={{ height: "100%" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
} 