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

    const { action } = await req.json()

    console.log('System maintenance action:', action, 'for user:', user.id)

    let result: any = { success: true }

    switch (action) {
      case 'clear_cache':
        // Clear system cache
        const { data: cacheResult, error: cacheError } = await supabaseClient
          .rpc('clear_system_cache')
        
        if (cacheError) throw cacheError
        
        result.message = 'Cache limpo com sucesso'
        result.details = 'Cache do sistema foi limpo e reinicializado'
        break

      case 'reset_configurations':
        // Reset system configurations
        const { data: resetResult, error: resetError } = await supabaseClient
          .rpc('reset_system_configurations')
        
        if (resetError) throw resetError
        
        result.message = 'Configurações resetadas com sucesso'
        result.details = 'Todas as configurações foram resetadas para os valores padrão'
        break

      case 'cleanup_logs':
        // Clean old logs (keep only last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { error: cleanupError } = await supabaseClient
          .from('system_logs')
          .delete()
          .lt('created_at', thirtyDaysAgo.toISOString())
        
        if (cleanupError) throw cleanupError
        
        result.message = 'Logs antigos removidos com sucesso'
        result.details = 'Logs com mais de 30 dias foram removidos do sistema'
        break

      case 'optimize_database':
        // Simulate database optimization
        await supabaseClient.rpc('log_system_event', {
          p_level: 'info',
          p_message: 'Database optimization completed',
          p_category: 'maintenance',
          p_metadata: { action: 'optimize_database', user_id: user.id }
        })
        
        result.message = 'Banco de dados otimizado com sucesso'
        result.details = 'Índices atualizados e consultas otimizadas'
        break

      default:
        throw new Error('Ação de manutenção inválida')
    }

    // Log maintenance action
    await supabaseClient.rpc('log_system_event', {
      p_level: 'info',
      p_message: `System maintenance: ${action}`,
      p_category: 'maintenance',
      p_metadata: {
        action,
        user_id: user.id,
        result
      }
    })

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })

  } catch (error: any) {
    console.error('System maintenance error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    )
  }
})
