import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== TESTANDO MERCADO PAGO TOKEN ===');
    
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!mercadoPagoToken) {
      console.error('❌ MERCADO_PAGO_ACCESS_TOKEN não configurado');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token não configurado',
          message: 'MERCADO_PAGO_ACCESS_TOKEN não foi encontrado nas variáveis de ambiente'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Token encontrado (length:', mercadoPagoToken.length, ')');
    
    // Testar o token fazendo uma chamada à API do Mercado Pago
    console.log('Testando token com API do Mercado Pago...');
    
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token inválido ou erro na API:', errorText);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token inválido',
          status: response.status,
          message: errorText,
          hint: 'Verifique se o token é de PRODUÇÃO (não sandbox) e tem as permissões corretas'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('✅ Token válido! Métodos de pagamento disponíveis:', data.length);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token do Mercado Pago está configurado e válido',
        tokenLength: mercadoPagoToken.length,
        paymentMethodsAvailable: data.length,
        environment: mercadoPagoToken.startsWith('TEST') ? 'SANDBOX' : 'PRODUCTION'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erro ao testar token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        hint: 'Verifique os logs para mais detalhes'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
