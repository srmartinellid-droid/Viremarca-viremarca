import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

type CookieToSet = {
  name: string
  value: string
  options?: Parameters<NextResponse["cookies"]["set"]>[2]
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/admin/login"
      redirectUrl.searchParams.set("next", path)
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (path === "/admin/login" && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/admin"
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
