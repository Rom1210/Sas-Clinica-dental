import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, role, organization_id } = await req.json()

    // 1. Invite the user
    const { data: authData, error: authError } = await supabaseClient.auth.admin.inviteUserByEmail(email)
    if (authError) throw authError

    // 2. Create profile and assignment
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({ id: authData.user.id, email: email, role: role })

    const { error: orgError } = await supabaseClient
      .from('organization_users')
      .insert({
        organization_id,
        user_id: authData.user.id,
        role,
        is_active: true
      })

    if (orgError) throw orgError

    return new Response(JSON.stringify({ message: 'Invitation sent' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
