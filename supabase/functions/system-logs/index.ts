import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { searchParams } = new URL(req.url)
    const level = searchParams.get('level')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')

    console.log('Fetching system logs for user:', user.id)

    let query = supabaseClient
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    // Apply filters
    if (level) {
      query = query.eq('level', level)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: logs, error } = await query

    if (error) {
      throw error
    }

    // Get total count for pagination
    let countQuery = supabaseClient
      .from('system_logs')
      .select('*', { count: 'exact', head: true })

    if (level) {
      countQuery = countQuery.eq('level', level)
    }

    if (category) {
      countQuery = countQuery.eq('category', category)
    }

    const { count } = await countQuery

    // Log access to system logs
    await supabaseClient.rpc('log_system_event', {
      p_level: 'info',
      p_message: 'System logs accessed',
      p_category: 'system_access',
      p_metadata: {
        filters: { level, category },
        page,
        limit,
        user_id: user.id
      }
    })

    return new Response(JSON.stringify({
      logs,
      pagination: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit)
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })

  } catch (error: any) {
    console.error('System logs error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    )
  }
})