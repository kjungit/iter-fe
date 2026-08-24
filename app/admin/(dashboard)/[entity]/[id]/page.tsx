import { notFound } from "next/navigation";
import { AdminDetailView } from "@/components/admin/AdminDetailView";
import type { AdminTabKey } from "@/components/admin/AdminListView";

const VALID_ENTITIES: Array<Exclude<AdminTabKey, "history">> = [
  "users",
  "equipment",
  "reports",
  "payments",
];

export default async function AdminDetailPage(props: PageProps<"/admin/[entity]/[id]">) {
  const { entity, id } = await props.params;

  if (!VALID_ENTITIES.includes(entity as Exclude<AdminTabKey, "history">)) {
    notFound();
  }

  return <AdminDetailView entity={entity as Exclude<AdminTabKey, "history">} id={id} />;
}
