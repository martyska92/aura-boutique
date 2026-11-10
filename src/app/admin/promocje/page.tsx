import { requireAdmin } from "@/lib/admin-auth";
import { PromotionsManagerClient } from "@/components/admin/PromotionsManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  await requireAdmin();

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <PromotionsManagerClient />
    </div>
  );
}

