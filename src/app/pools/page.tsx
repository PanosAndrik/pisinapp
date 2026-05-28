import { redirect } from "next/navigation";

export default function LegacyPoolsPage() {
  redirect("/app/admin/pools");
}
