import { notFound } from "next/navigation";
import { AdminDetailView } from "@/components/admin/AdminDetailView";
import type { AdminEntityKey } from "@/lib/admin-config";

const VALID_ENTITIES: AdminEntityKey[] = ["users", "equipment", "reports", "disputes"];

export default async function AdminDetailPage(props: PageProps<"/admin/[entity]/[id]">) {
  const { entity, id } = await props.params;

  if (!VALID_ENTITIES.includes(entity as AdminEntityKey)) {
    notFound();
  }

  return <AdminDetailView entity={entity as AdminEntityKey} id={id} />;
}
