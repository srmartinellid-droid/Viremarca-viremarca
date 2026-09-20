"use client"

import { trackEvent } from "@/lib/track-event"

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { eventName: string; eventMetadata?: Record<string, string | number | boolean | null> }

export function TrackedAnchor({ eventName, eventMetadata, onClick, children, ...props }: Props) {
  return <a {...props} onClick={(event) => { void trackEvent(eventName, eventMetadata); onClick?.(event) }}>{children}</a>
}
