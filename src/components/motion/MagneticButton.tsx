"use client"

import Link from "next/link"
import { useMagnetic } from "@/hooks/useMagnetic"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/lib/track-event"

type Common = {
  children: React.ReactNode
  className?: string
  variant?: "primary" | "secondary" | "ghost" | "dark"
  contactContext?: "hero" | "contact_section" | "other"
}

type AsLink = Common & { href: string; onClick?: never }
type AsButton = Common & { href?: never; onClick?: () => void; type?: "button" | "submit" }

type Props = AsLink | AsButton

const variants = {
  primary:
    "bg-vm-coral text-white shadow-sm hover:bg-vm-coral-deep border border-transparent",
  secondary:
    "bg-white text-vm-ink border border-vm-border hover:bg-vm-sand",
  ghost:
    "bg-transparent text-vm-ink border border-transparent hover:bg-vm-sand/60",
  dark:
    "bg-vm-ink text-white border border-transparent hover:bg-vm-charcoal",
}

export function MagneticButton(props: Props) {
  const { children, className, variant = "primary" } = props
  const { ref, onMouseMove, onMouseLeave } = useMagnetic<HTMLAnchorElement | HTMLButtonElement>({
    strength: 0.22,
    radius: 72,
  })

  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-300 will-change-transform"

  const classes = cn(base, variants[variant], className)
  const motionStyle = { transition: "transform 180ms cubic-bezier(0.22,1,0.36,1)" }

  if ("href" in props && props.href) {
    const isExternal =
      props.href.startsWith("http") ||
      props.href.startsWith("mailto:") ||
      props.href.startsWith("https://wa.me")

    if (isExternal) {
      return (
        <a
          href={props.href}
          target="_blank"
          rel="noopener noreferrer"
          ref={ref as React.RefObject<HTMLAnchorElement>}
          onClick={() => {
            if (props.href.startsWith("https://wa.me")) {
              void trackEvent("whatsapp_click", { location: "cta" }, "production")
              void trackEvent("contact_cta_context", { location: props.contactContext ?? "other" }, "lab")
            } else if (props.href.startsWith("mailto:")) {
              void trackEvent("email_click", { location: "cta" }, "production")
              void trackEvent("contact_cta_context", { location: props.contactContext ?? "other" }, "lab")
            }
          }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className={classes}
          style={motionStyle}
        >
          {children}
        </a>
      )
    }

    return (
      <Link
        href={props.href}
        ref={ref as React.RefObject<HTMLAnchorElement>}
        onClick={() => { if (props.href === "/#contato") { void trackEvent("contact_started", { location: "cta" }, "production"); void trackEvent("contact_cta_context", { location: props.contactContext ?? "other" }, "lab") } else if (props.href === "/virelab") void trackEvent("virelab_click", { location: "cta" }, "production"); else if (props.href === "/#sites") void trackEvent("portfolio_view", { location: "cta" }, "production") }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className={classes}
        style={motionStyle}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type={(props as AsButton).type ?? "button"}
      onClick={(props as AsButton).onClick}
      ref={ref as React.RefObject<HTMLButtonElement>}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={classes}
      style={motionStyle}
    >
      {children}
    </button>
  )
}
