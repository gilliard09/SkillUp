import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    // 1. Verifica se quem chama é admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Sem autorização' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: callerUser } } = await supabaseUser.auth.getUser()
    if (!callerUser) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Lê o body
    const { email, password, fullName, courseId } = await req.json()

    if (!email || !courseId) {
      return new Response(JSON.stringify({ error: 'Email e curso são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Cliente admin (service role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 4. Verifica se o usuário já existe pelo email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    let userId: string

    if (existingUser) {
      // Usuário já existe — apenas reutiliza o ID
      userId = existingUser.id

      // Garante que o perfil existe
      await supabaseAdmin
        .from('profiles')
        .upsert([{ id: userId, full_name: fullName || existingUser.user_metadata?.full_name || '', xp: 0 }], {
          onConflict: 'id',
          ignoreDuplicates: true,
        })

    } else {
      // Usuário não existe — cria normalmente
      if (!password || !fullName) {
        return new Response(JSON.stringify({ error: 'Senha e nome são obrigatórios para novo aluno' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })

      if (createError) throw createError
      userId = newUser.user.id

      // Cria o perfil
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert([{ id: userId, full_name: fullName, xp: 0 }])

      if (profileError) throw profileError
    }

    // 5. Verifica se já está matriculado nesse curso
    const { data: existingEnrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', courseId)
      .maybeSingle()

    if (existingEnrollment) {
      return new Response(JSON.stringify({
        success: true,
        userId,
        message: 'Aluno já estava matriculado neste curso.',
        alreadyEnrolled: true,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 6. Cria a matrícula no novo curso
    const { error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .insert([{ user_id: userId, product_id: courseId }])

    if (enrollError) throw enrollError

    return new Response(JSON.stringify({
      success: true,
      userId,
      message: existingUser ? 'Aluno existente matriculado no novo curso!' : 'Aluno criado e matriculado!',
      alreadyEnrolled: false,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})