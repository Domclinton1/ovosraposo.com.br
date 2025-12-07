import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') as string;
const hookSecret = Deno.env.get('AUTH_HOOK_SECRET') as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getEmailTemplate = (resetUrl: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha - Ovos Raposo</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f6f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 40px;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://hcqsokycqfhwpfrtugnh.supabase.co/storage/v1/object/public/avatars/logo-ovos-raposo-colorida.jpg" alt="Ovos Raposo" width="180" style="border-radius: 8px;">
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <h1 style="margin: 0; color: #333333; font-size: 28px; font-weight: bold;">Redefinir Senha</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding-bottom: 16px;">
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 24px;">
                Olá! Recebemos uma solicitação para redefinir a senha da sua conta Ovos Raposo.
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #ea384c; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                Redefinir Minha Senha
              </a>
            </td>
          </tr>

          <!-- Link text -->
          <tr>
            <td style="padding-bottom: 8px;">
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 24px;">
                Ou copie e cole este link no seu navegador:
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom: 16px;">
              <div style="background-color: #f6f6f6; padding: 12px; border-radius: 4px; word-break: break-all;">
                <p style="margin: 0; color: #666666; font-size: 12px; line-height: 18px;">
                  ${resetUrl}
                </p>
              </div>
            </td>
          </tr>

          <!-- Notice -->
          <tr>
            <td align="center" style="padding-bottom: 16px;">
              <p style="margin: 0; color: #ea384c; font-size: 14px; font-weight: 600;">
                Este link expira em 1 hora por motivos de segurança.
              </p>
            </td>
          </tr>

          <!-- Footer text -->
          <tr>
            <td style="padding-bottom: 16px;">
              <p style="margin: 0; color: #898989; font-size: 14px; line-height: 20px;">
                Se você não solicitou a redefinição de senha, pode ignorar este email com segurança.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px; border-top: 1px solid #eeeeee;">
              <p style="margin: 8px 0; color: #898989; font-size: 14px; line-height: 20px;">
                © ${new Date().getFullYear()} Ovos Raposo - Ovos frescos direto da fazenda 🥚
              </p>
              <p style="margin: 8px 0; color: #898989; font-size: 14px; line-height: 20px;">
                Petrópolis, RJ
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

serve(async (req) => {
  console.log('🔐 Password reset email function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log('📧 Processing password reset email request');

    // Verify webhook signature
    const wh = new Webhook(hookSecret);
    let webhookData;
    
    try {
      webhookData = wh.verify(payload, headers);
    } catch (error) {
      console.error('❌ Webhook verification failed:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const {
      user,
      email_data: { token_hash, redirect_to },
    } = webhookData as {
      user: {
        email: string;
      };
      email_data: {
        token_hash: string;
        redirect_to: string;
      };
    };

    console.log('👤 User email:', user.email);
    console.log('🔗 Redirect to:', redirect_to);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const resetUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=recovery&redirect_to=${redirect_to}`;

    const html = getEmailTemplate(resetUrl);

    console.log('📨 Sending email via Resend...');

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ovos Raposo <onboarding@resend.dev>', // Altere para seu domínio verificado quando possível
        to: [user.email],
        subject: 'Redefinir senha - Ovos Raposo',
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error sending email:', error);
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('❌ Error in send-password-reset function:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
