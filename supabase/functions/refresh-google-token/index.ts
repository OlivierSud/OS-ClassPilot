import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Option request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verifier l'utilisateur
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Response('Unauthorized', { status: 401 })

    // Récupérer le corps de la requête (optionnel)
    let bodyToken = null
    try {
      const body = await req.json()
      bodyToken = body.refresh_token
    } catch (e) {}

    let tokenToUse = bodyToken

    if (!tokenToUse) {
      // Chercher en base de donnees
      const { data, error: dbError } = await supabaseClient
        .from('user_preferences')
        .select('google_refresh_token')
        .eq('user_id', user.id)
        .single()
      
      if (dbError || !data?.google_refresh_token) {
        throw new Response(JSON.stringify({ error: 'No refresh token available. User must re-authenticate.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }
      tokenToUse = data.google_refresh_token
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Response(JSON.stringify({ error: 'Server configuration missing. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set as Supabase secrets.' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      })
    }

    // Demander un nouveau token d'acces à Google
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenToUse,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Google OAuth token refresh error:', data)
      throw new Response(JSON.stringify({ error: 'Google API error', details: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status 
      })
    }

    // Enregistrer le nouveau token localement
    await supabaseClient
      .from('user_preferences')
      .update({ google_access_token: data.access_token })
      .eq('user_id', user.id)

    return new Response(JSON.stringify({ 
      access_token: data.access_token,
      expires_in: data.expires_in
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
