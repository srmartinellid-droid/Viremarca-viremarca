import { requireAdmin } from "@/lib/auth"
import { VisualSettingsStudio } from "@/components/VisualSettingsStudio"

export default async function AdminVisualPage() {
  await requireAdmin()
  return <VisualSettingsStudio />
}
