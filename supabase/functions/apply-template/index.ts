import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { templateId } = await req.json();

    // Get template data
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      throw new Error("Template not found");
    }

    const templateData = template.template_data;
    const setupSql: string[] = [];

    // Generate SQL for database schema
    if (templateData.database?.tables) {
      for (const table of templateData.database.tables) {
        // Create table
        const columns = table.columns
          .map((col: any) => `${col.name} ${col.type}${col.constraints ? ' ' + col.constraints : ''}`)
          .join(',\n  ');
        
        setupSql.push(`
-- Create ${table.name} table
CREATE TABLE IF NOT EXISTS public.${table.name} (
  ${columns}
);
`);

        // Enable RLS
        setupSql.push(`ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;`);
      }
    }

    // Create enums
    if (templateData.database?.enums) {
      for (const enumDef of templateData.database.enums) {
        setupSql.push(`
-- Create ${enumDef.name} enum
DO $$ BEGIN
  CREATE TYPE public.${enumDef.name} AS ENUM (${enumDef.values.map((v: string) => `'${v}'`).join(', ')});
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
`);
      }
    }

    // Create RLS policies
    if (templateData.database?.policies) {
      for (const policy of templateData.database.policies) {
        setupSql.push(`
-- Create policy: ${policy.name}
CREATE POLICY "${policy.name}"
ON public.${policy.table}
FOR ${policy.command}
TO ${policy.to || 'authenticated'}
${policy.using ? `USING (${policy.using})` : ''}
${policy.with_check ? `WITH CHECK (${policy.with_check})` : ''};
`);
      }
    }

    // Create functions
    if (templateData.database?.functions) {
      for (const func of templateData.database.functions) {
        setupSql.push(`
-- Create function: ${func.name}
${func.sql}
`);
      }
    }

    // Create a project or idea entry for this template application
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: `${template.name} - New Project`,
        idea_id: null, // Will be linked later if needed
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Return the setup SQL and component code
    return new Response(
      JSON.stringify({
        success: true,
        projectId: project.id,
        setupSql: setupSql.join('\n'),
        components: templateData.components || [],
        features: templateData.features || [],
        message: "Template ready to apply. Please review and execute the SQL in your database.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error applying template:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
