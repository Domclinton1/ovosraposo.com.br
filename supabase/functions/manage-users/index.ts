import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user from token and verify admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      console.error('Authorization failed - not admin:', roleError);
      return new Response(
        JSON.stringify({ error: 'Acesso negado - apenas administradores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, email, role, userId, password } = body;

    // Validate input based on action
    if (action === 'createUser') {
      if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 255) {
        return new Response(
          JSON.stringify({ error: 'Email inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const validRoles = ['admin', 'expedition', 'logistics'];
      if (!role || !validRoles.includes(role)) {
        return new Response(
          JSON.stringify({ error: 'Função inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (password && (typeof password !== 'string' || password.length < 8 || password.length > 100)) {
        return new Response(
          JSON.stringify({ error: 'Senha deve ter entre 8 e 100 caracteres' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'listUsers') {
      // List all users with their profiles and roles
      const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (usersError) throw usersError

      // Get profiles and roles for all users
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
      
      if (profilesError) throw profilesError

      const { data: roles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('*')
      
      if (rolesError) throw rolesError

      // Combine the data
      const combinedUsers = users.users.map(user => ({
        ...user,
        profile: profiles?.find(p => p.user_id === user.id) || null,
        roles: roles?.filter(r => r.user_id === user.id).map(r => r.role) || []
      }))

      return new Response(JSON.stringify({ users: combinedUsers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'listCustomers') {
      // List only customer users (no staff roles)
      const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (usersError) throw usersError

      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
      
      if (profilesError) throw profilesError

      const { data: roles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('*')
      
      if (rolesError) throw rolesError

      // Filter customers only (no admin, expedition, or logistics roles)
      const customers = users.users
        .filter(user => {
          const userRoles = roles?.filter(r => r.user_id === user.id).map(r => r.role) || []
          const hasStaffRole = userRoles.some(role => 
            ['admin', 'expedition', 'logistics'].includes(role)
          )
          return !hasStaffRole
        })
        .map(user => ({
          id: user.id,
          email: user.email,
          profile: profiles?.find(p => p.user_id === user.id) || null
        }))

      return new Response(JSON.stringify({ customers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'createUser') {
      // Create new user
      const createUserPayload: any = {
        email,
        email_confirm: true,
        user_metadata: {
          full_name: email.split('@')[0]
        }
      }
      
      // If password is provided, set it directly
      if (password) {
        createUserPayload.password = password
      }
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser(createUserPayload)

      if (createError) throw createError

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: newUser.user.id,
          full_name: email.split('@')[0],
          phone: '',
          email: email
        })

      if (profileError) throw profileError

      // Add role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: role
        })

      if (roleError) throw roleError

      // Send password reset email only if no password was provided
      if (!password) {
        const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
        })

        if (resetError) console.error('Error sending reset email:', resetError)
      }

      return new Response(JSON.stringify({ success: true, user: newUser.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error) {
    console.error('Error in manage-users:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar requisição' }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})