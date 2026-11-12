import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas públicas que não devem ser acessadas por usuários já autenticados.
const PUBLIC_ONLY_ROUTES = ['/login', '/vip-register']

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas.')
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({
          request: { headers: request.headers },
        })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({
          request: { headers: request.headers },
        })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isDashboard = pathname.startsWith('/dashboard')
  const isPublicOnly = PUBLIC_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  )
  const isRoot = pathname === '/'

  // Não autenticado tentando acessar o dashboard → login.
  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // A rota /update-password fica fora desta regra de propósito:
  // o usuário precisa conseguir concluir a recuperação mesmo se já houver
  // uma sessão anterior no navegador.
  if (user && (isPublicOnly || isRoot)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/update-password',
    '/vip-register/:path*',
    '/dashboard/:path*',
  ],
}
