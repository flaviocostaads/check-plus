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

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      throw new Error('No file uploaded')
    }

    console.log('Importing data for user:', user.id, 'filename:', file.name)

    const fileContent = await file.text()
    let importData: any

    try {
      importData = JSON.parse(fileContent)
    } catch (error) {
      throw new Error('Invalid JSON file format')
    }

    let importResults: any = {
      success: true,
      imported_tables: [],
      errors: []
    }

    // Import vehicles if present
    if (importData.vehicles && Array.isArray(importData.vehicles)) {
      try {
        const { error } = await supabaseClient
          .from('vehicles')
          .upsert(importData.vehicles, { onConflict: 'placa' })
        
        if (error) throw error
        importResults.imported_tables.push({
          table: 'vehicles',
          count: importData.vehicles.length
        })
      } catch (error) {
        importResults.errors.push({
          table: 'vehicles',
          error: (error as any).message
        })
      }
    }

    // Import drivers if present
    if (importData.drivers && Array.isArray(importData.drivers)) {
      try {
        const { error } = await supabaseClient
          .from('drivers')
          .upsert(importData.drivers, { onConflict: 'cpf' })
        
        if (error) throw error
        importResults.imported_tables.push({
          table: 'drivers',
          count: importData.drivers.length
        })
      } catch (error) {
        importResults.errors.push({
          table: 'drivers',
          error: (error as any).message
        })
      }
    }

    // Import company settings if present
    if (importData.company_settings && Array.isArray(importData.company_settings)) {
      try {
        const { error } = await supabaseClient
          .from('company_settings')
          .upsert(importData.company_settings)
        
        if (error) throw error
        importResults.imported_tables.push({
          table: 'company_settings',
          count: importData.company_settings.length
        })
      } catch (error) {
        importResults.errors.push({
          table: 'company_settings',
          error: (error as any).message
        })
      }
    }

    // Log import action
    await supabaseClient.rpc('log_system_event', {
      p_level: importResults.errors.length > 0 ? 'warning' : 'info',
      p_message: `Data import completed. ${importResults.imported_tables.length} tables processed`,
      p_category: 'data_import',
      p_metadata: {
        filename: file.name,
        imported_tables: importResults.imported_tables,
        errors: importResults.errors,
        user_id: user.id
      }
    })

    return new Response(JSON.stringify(importResults), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })

  } catch (error: any) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    )
  }
})