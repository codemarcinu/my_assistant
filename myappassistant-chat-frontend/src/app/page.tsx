"use client";
import "@/i18n";
import { CommandCenter } from "@/components/dashboard/CommandCenter";
import { Layout } from "@/components/layout/Layout";

export default function Home() {
  return (
    <Layout>
      <CommandCenter />
    </Layout>
  );
}
