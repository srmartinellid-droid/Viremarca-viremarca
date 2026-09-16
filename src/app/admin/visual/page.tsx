import { requireAdmin } from "@/lib/auth"
import { VisualSettings } from "@/components/VisualSettings"

export default async function AdminVisualPage() {
  await requireAdmin()
  return <VisualSettings />
}
