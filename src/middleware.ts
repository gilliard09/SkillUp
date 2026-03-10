import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Criamos a resposta inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Configuramos o cliente do Supabase específico para o Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Atualiza os cookies na requisição e na resposta simultaneamente
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          // CORREÇÃO: Removido o 'value' que não existia aqui
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Verifica o usuário (Importante: use getUser() para segurança no Middleware)
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Lógica de Proteção de Rotas
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isLoginPage = request.nextUrl.pathname === '/login'

  // Se não estiver logado e tentar acessar o dashboard -> Vai para o Login
  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se já estiver logado e tentar acessar o login -> Vai para o Dashboard
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Matcher atualizado para ignorar arquivos estáticos e focar nas rotas
     */
    '/dashboard/:path*', 
    '/login'
  ],
}