"use client"

import { VisualSettingsStudio } from "@/components/VisualSettingsStudio"

/**
 * Compatibility wrapper.
 * The admin shell historically imported VisualSettings, while the complete
 * visual studio now lives in VisualSettingsStudio. Keeping this export avoids
 * two divergent visual-admin implementations.
 */
export function VisualSettings() {
  return <VisualSettingsStudio />
}
