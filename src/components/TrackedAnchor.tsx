"use client"

import { trackEvent } from "@/lib/track-event"

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventName: string
  eventMetadata?: Record<string, string | number | boolean | null>
  eventStatus?: "production" | "lab"
  contactContext?: "hero" | "contact_section" | "other"
}

export function TrackedAnchor({ eventName, eventMetadata, eventStatus, contactContext, onClick, children, ...props }: Props) {
  return (
    <a
      {...props}
      onClick={(event) => {
        void trackEvent(eventName, eventMetadata, eventStatus ?? "production")
        if (contactContext) void trackEvent("contact_cta_context", { location: contactContext }, "lab")
        onClick?.(event)
      }}
    >
      {children}
    </a>
  )
}
