import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('=== AUTH DEBUG ===');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role client - JWT is validated automatically via Authorization header
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('✅ Request authenticated via Authorization header');

    const { items, orderId, customerInfo, paymentMethod, totalAmount, cardToken, paymentMethodId, issuerId } = await req.json();
    
    console.log('=== CREATE PAYMENT - START ===');
    console.log('Order ID:', orderId);
    console.log('Payment method:', paymentMethod);
    console.log('Total amount:', totalAmount);
    console.log('Has card token:', !!cardToken);
    console.log('Card token value:', cardToken ? '***EXISTS***' : 'NULL/UNDEFINED/EMPTY');
    console.log('Payment method ID:', paymentMethodId || 'MISSING');
    console.log('Issuer ID:', issuerId || 'MISSING');

    // Validar valor mínimo para pagamentos com cartão
    const minCardAmount = 1.00;
    if ((paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && Number(totalAmount) < minCardAmount) {
      console.error(`Card payment amount ${totalAmount} is below minimum ${minCardAmount}`);
      return new Response(
        JSON.stringify({ 
          error: `O valor mínimo para pagamento com cartão é R$ ${minCardAmount.toFixed(2)}`,
          code: 'MINIMUM_AMOUNT_ERROR',
          minimumAmount: minCardAmount,
          currentAmount: totalAmount
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://ovosraposo.com.br';

    // Se for PIX, usar API de Payment (gera QR Code)
    if (paymentMethod === 'pix') {
      console.log('Creating PIX payment with QR Code...');
      
      const pixPayment = {
        transaction_amount: Number(totalAmount),
        description: `Pedido #${orderId} - Ovos Raposo`,
        payment_method_id: 'pix',
        payer: {
          email: customerInfo.email || 'cliente@ovosraposo.com.br',
          first_name: customerInfo.name?.split(' ')[0] || 'Cliente',
          last_name: customerInfo.name?.split(' ').slice(1).join(' ') || 'Ovos Raposo',
        },
        notification_url: `${supabaseUrl}/functions/v1/mercado-pago-webhook`,
        external_reference: String(orderId),
      };

      console.log('Sending PIX payment request to Mercado Pago...');

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${orderId}-${Date.now()}`,
        },
        body: JSON.stringify(pixPayment),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Mercado Pago PIX API error:', errorText);
        throw new Error(`Mercado Pago API error: ${response.status}`);
      }

      const pixData = await response.json();
      console.log('PIX payment created:', pixData.id);
      console.log('QR Code generated:', pixData.point_of_interaction?.transaction_data?.qr_code ? 'Yes' : 'No');

      // Salvar QR Code no pedido
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          mercado_pago_payment_id: String(pixData.id),
          pix_qr_code: pixData.point_of_interaction?.transaction_data?.qr_code,
          pix_qr_code_base64: pixData.point_of_interaction?.transaction_data?.qr_code_base64,
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order with PIX data:', updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          paymentType: 'pix',
          paymentId: pixData.id,
          qrCode: pixData.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64: pixData.point_of_interaction?.transaction_data?.qr_code_base64,
          ticketUrl: pixData.point_of_interaction?.transaction_data?.ticket_url,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Para cartão com token (Checkout Transparente), processar pagamento diretamente
    if ((paymentMethod === 'debit_card' || paymentMethod === 'credit_card') && cardToken) {
      console.log('Processing card payment with token (Transparent Checkout)...');
      
      const cardPayment = {
        transaction_amount: Number(totalAmount),
        token: cardToken,
        description: `Pedido #${orderId} - Ovos Raposo`,
        installments: paymentMethod === 'credit_card' ? 1 : 1, // Pode ser ajustado
        payment_method_id: paymentMethodId,
        issuer_id: issuerId || undefined,
        payer: {
          email: customerInfo.email || 'cliente@ovosraposo.com.br',
          identification: {
            type: customerInfo.identificationType || 'CPF',
            number: customerInfo.identificationNumber?.replace(/\D/g, '') || '',
          },
        },
        notification_url: `${supabaseUrl}/functions/v1/mercado-pago-webhook`,
        external_reference: String(orderId),
        statement_descriptor: 'OVOS RAPOSO',
      };

      console.log('Sending card payment request to Mercado Pago...');

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${orderId}-${Date.now()}`,
        },
        body: JSON.stringify(cardPayment),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Mercado Pago Card Payment API error:', errorText);
        throw new Error(`Mercado Pago API error: ${response.status} - ${errorText}`);
      }

      const cardData = await response.json();
      console.log('Card payment created:', cardData.id);
      console.log('Payment status:', cardData.status);

      // Salvar payment ID no pedido
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          mercado_pago_payment_id: String(cardData.id),
          status: cardData.status === 'approved' ? 'paid' : 'pending_payment',
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order with card payment data:', updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          paymentType: 'card',
          paymentId: cardData.id,
          status: cardData.status,
          statusDetail: cardData.status_detail,
          // Se aprovado, redirecionar para confirmação
          approved: cardData.status === 'approved',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se chegou aqui, é cartão SEM token - isso NÃO deve acontecer no Checkout Transparente
    if (paymentMethod === 'debit_card' || paymentMethod === 'credit_card') {
      console.error('Card payment attempted without token - Transparent Checkout requires token');
      return new Response(
        JSON.stringify({ 
          error: 'Token do cartão é obrigatório',
          code: 'CARD_TOKEN_REQUIRED',
          detail: 'Para pagamentos com cartão, é necessário fornecer os dados do cartão. Por favor, preencha todos os campos do formulário.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Método de pagamento não reconhecido
    console.error('Unknown payment method:', paymentMethod);
    return new Response(
      JSON.stringify({ 
        error: 'Método de pagamento não reconhecido',
        code: 'INVALID_PAYMENT_METHOD'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
