import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verifica se quem chama é admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Sem autorização' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Cliente com a chave do usuário (para verificar se é admin)
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

    if (!email || !password || !fullName || !courseId) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios faltando' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Cria o usuário com a chave de SERVICE (não afeta sessão do admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // já confirma o email automaticamente
      user_metadata: { full_name: fullName },
    })

    if (createError) throw createError

    // 4. Cria o perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([{ id: newUser.user.id, full_name: fullName, xp: 0 }])

    if (profileError) throw profileError

    // 5. Cria a matrícula
    const { error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .insert([{ user_id: newUser.user.id, product_id: courseId }])

    if (enrollError) throw enrollError

    return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})