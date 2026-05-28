import { redirect } from "next/navigation";

export default function LegacyVisitsPage() {
  redirect("/app/technician/visits");
}
