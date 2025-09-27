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
    const dataType = searchParams.get('type') || 'all'

    console.log('Exporting data for user:', user.id, 'type:', dataType)

    let exportData: any = {}

    // Export different types of data based on request
    switch (dataType) {
      case 'inspections':
        const { data: inspections } = await supabaseClient
          .from('inspections')
          .select(`
            *,
            vehicles(*),
            inspection_items(*),
            damage_markers(*)
          `)
        exportData.inspections = inspections
        break

      case 'vehicles':
        const { data: vehicles } = await supabaseClient
          .from('vehicles')
          .select('*')
        exportData.vehicles = vehicles
        break

      case 'drivers':
        const { data: drivers } = await supabaseClient
          .from('drivers')
          .select('*')
        exportData.drivers = drivers
        break

      case 'all':
      default:
        // Export all data
        const [inspectionsResult, vehiclesResult, driversResult, settingsResult] = await Promise.all([
          supabaseClient.from('inspections').select('*'),
          supabaseClient.from('vehicles').select('*'),
          supabaseClient.from('drivers').select('*'),
          supabaseClient.from('company_settings').select('*')
        ])

        exportData = {
          inspections: inspectionsResult.data,
          vehicles: vehiclesResult.data,
          drivers: driversResult.data,
          company_settings: settingsResult.data,
          exported_at: new Date().toISOString(),
          exported_by: user.id
        }
        break
    }

    // Log export action
    await supabaseClient.rpc('log_system_event', {
      p_level: 'info',
      p_message: `Data export completed for type: ${dataType}`,
      p_category: 'data_export',
      p_metadata: {
        export_type: dataType,
        records_count: Object.keys(exportData).length,
        user_id: user.id
      }
    })

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `nsa-checklist-export-${dataType}-${timestamp}.json`

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error: any) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    )
  }
})