import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Iniciando teste de envio ao ClickUp...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Dados de teste completos
    const testOrderData = {
      orderId: `TEST-${Date.now()}`,
      customerName: 'João Silva (TESTE)',
      customerPhone: '24987654321',
      items: [
        {
          name: '12 Ovos Extra Branco',
          quantity: 2,
          price: 11.95
        },
        {
          name: '20 Ovos Extra Vermelho',
          quantity: 1,
          price: 19.90
        }
      ],
      address: 'Rua das Flores, 123 - Apartamento 45',
      neighborhood: 'Centro',
      city: 'Petrópolis',
      phone: '24987654321',
      total: 43.80,
      paymentMethod: 'Pago pelo site - Cartão de Crédito'
    };

    console.log('📦 Dados do pedido de teste:', JSON.stringify(testOrderData, null, 2));

    // Chamar a função create-clickup-task
    const { data, error } = await supabase.functions.invoke(
      'create-clickup-task',
      {
        body: testOrderData
      }
    );

    if (error) {
      console.error('❌ Erro ao criar task no ClickUp:', error);
      throw error;
    }

    console.log('✅ Task criada com sucesso no ClickUp!');
    console.log('📋 Resposta:', JSON.stringify(data, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Pedido de teste enviado ao ClickUp com sucesso!',
        taskData: data,
        testOrder: testOrderData
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
