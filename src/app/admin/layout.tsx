import React from "react";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = {
  title: "Panel Zarządzania | AURA Boutique K.B.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF6F1] text-[#241D1B] flex flex-col font-sans">
      <AdminNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
