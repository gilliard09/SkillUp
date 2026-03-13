import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ============================================================
// ROTAS PÚBLICAS — usuário logado é redirecionado para /dashboard
// ============================================================
const PUBLIC_ONLY_ROUTES = ['/login', '/vip-register']

export async function middleware(request: NextRequest) {
  // Variáveis de ambiente com verificação explícita
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas.')
    return NextResponse.next()
  }

  // ----------------------------------------------------------
  // 1. Resposta inicial
  // ----------------------------------------------------------
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // ----------------------------------------------------------
  // 2. Cliente Supabase para Middleware
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // 3. Verifica sessão — getUser() é seguro no middleware
  // ----------------------------------------------------------
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isDashboard   = pathname.startsWith('/dashboard')
  const isPublicOnly  = PUBLIC_ONLY_ROUTES.some(r => pathname.startsWith(r))
  const isRoot        = pathname === '/'

  // ----------------------------------------------------------
  // 4. Proteção de rotas
  // ----------------------------------------------------------

  // Não logado tentando acessar dashboard → Login
  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logado tentando acessar login, vip-register ou / → Dashboard
  if (user && (isPublicOnly || isRoot)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

// ============================================================
// MATCHER — cobre dashboard, login, vip-register e raiz
// ============================================================
export const config = {
  matcher: [
    '/',
    '/login',
    '/vip-register/:path*',
    '/dashboard/:path*',
  ],
}