import { Suspense } from "react";
import { AdminListView } from "@/components/admin/AdminListView";

export default function AdminPage() {
  return (
    <Suspense>
      <AdminListView />
    </Suspense>
  );
}
