import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      code, 
      filePath, 
      commitMessage, 
      githubRepo, 
      githubToken,
      projectId,
      phaseNumber,
      taskId,
      aiModel,
      optimizedForLovable
    } = await req.json();

    if (!code || !filePath || !commitMessage || !githubRepo || !githubToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse owner and repo from githubRepo (format: "owner/repo")
    const [owner, repo] = githubRepo.split('/');
    
    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: 'Invalid GitHub repository format. Expected "owner/repo"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the current file SHA if it exists (required for updates)
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Lovable-AI-Commit'
        }
      }
    );

    let sha = null;
    if (getFileResponse.ok) {
      const fileData = await getFileResponse.json();
      sha = fileData.sha;
    }

    // Encode the code content to base64
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const base64Content = btoa(String.fromCharCode(...data));

    // Create or update the file
    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Lovable-AI-Commit'
        },
        body: JSON.stringify({
          message: commitMessage,
          content: base64Content,
          ...(sha && { sha })
        })
      }
    );

    if (!commitResponse.ok) {
      const error = await commitResponse.json();
      throw new Error(`GitHub API error: ${error.message || 'Unknown error'}`);
    }

    const commitData = await commitResponse.json();

    // Store commit record in database
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (user) {
      await supabase.from('code_commits').insert({
        user_id: user.id,
        project_id: projectId,
        phase_number: phaseNumber,
        task_id: taskId,
        github_repo: githubRepo,
        file_path: filePath,
        commit_message: commitMessage,
        commit_sha: commitData.commit.sha,
        commit_url: commitData.commit.html_url,
        code_content: code,
        ai_model_used: aiModel,
        optimized_for_lovable: optimizedForLovable || false
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        commitUrl: commitData.commit.html_url,
        commitSha: commitData.commit.sha
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error committing to GitHub:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
