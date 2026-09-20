import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"
import { VisualSettingsStudioV2 } from "@/components/VisualSettingsStudioV2"

export default async function VisualSettingsPage() {
  await requireAdmin()
  return <VisualSettingsStudioV2 />
}
