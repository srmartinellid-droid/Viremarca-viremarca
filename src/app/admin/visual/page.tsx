import { requireAdmin } from "@/lib/auth"
import { VisualSettingsStudioV2 } from "@/components/VisualSettingsStudioV2"

export default async function VisualSettingsPage() {
  await requireAdmin()
  return <VisualSettingsStudioV2 />
}
