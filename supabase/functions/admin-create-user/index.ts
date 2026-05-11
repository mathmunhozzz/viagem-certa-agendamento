import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  accountStatus?: 'approved' | 'pending' | 'rejected';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin, error: roleError } = await supabaseClient
      .rpc('has_role', { required_role: 'admin', check_user_id: user.id });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: CreateUserRequest = await req.json();
    const { email, password, name, role, accountStatus = 'approved' } = body;

    if (!email || !password || !name || !role) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios: email, password, name, role' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Senha deve ter pelo menos 6 caracteres' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!['admin', 'manager', 'user'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Papel inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create user
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError || !created.user) {
      console.log('Create user failed:', createError);
      return new Response(JSON.stringify({ error: createError?.message || 'Falha ao criar usuário' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = created.user.id;

    // Ensure profile exists (trigger should do it, but guarantee)
    await supabaseAdmin.from('profiles').upsert({
      user_id: newUserId,
      name,
      role,
      account_status: accountStatus,
    }, { onConflict: 'user_id' });

    // Set role: remove existing, insert new
    await supabaseAdmin.from('user_roles').delete().eq('user_id', newUserId);
    const { error: insertRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUserId, role });

    if (insertRoleError) {
      console.log('Insert role failed:', insertRoleError);
    }

    console.log(`User ${email} created by admin ${user.id} with role ${role}`);

    return new Response(JSON.stringify({
      success: true,
      userId: newUserId,
      email,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Error in admin-create-user:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
