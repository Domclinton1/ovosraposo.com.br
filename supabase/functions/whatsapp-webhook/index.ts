import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageTimestamp: number;
    pushName: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('EVOLUTION_WEBHOOK_SECRET');
    
    // SECURITY: Webhook secret is mandatory
    if (!webhookSecret) {
      console.error('EVOLUTION_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook não configurado corretamente' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate webhook signature
    const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-hub-signature-256');
    
    if (!signature) {
      console.warn('Webhook request without signature');
      return new Response(
        JSON.stringify({ error: 'Assinatura necessária' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== expectedSignature) {
      console.warn('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Assinatura inválida' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the validated body
    const payload: WebhookPayload = JSON.parse(body);
    console.log('Webhook validated and received:', payload.event);

    // Process the validated webhook
    await processWebhook(payload, supabase);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar webhook' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processWebhook(payload: WebhookPayload, supabase: any) {
  // Process only incoming messages (not sent by us)
  if (payload.event === 'messages.upsert' && !payload.data.key.fromMe) {
    const phone = payload.data.key.remoteJid.replace('@s.whatsapp.net', '');
    const messageText = payload.data.message.conversation || 
                       payload.data.message.extendedTextMessage?.text || '';
    
    // SECURITY: Validate message length before processing
    if (messageText.length > 5000) {
      console.warn('Message too long, rejecting:', messageText.length);
      return;
    }
    
    // SECURITY: Enhanced phone validation
    // 1. Check phone format and length (10-15 digits only)
    if (!/^\d{10,15}$/.test(phone)) {
      console.warn('Invalid phone format:', phone);
      return;
    }
    
    // 2. Explicit length check for Brazilian phones (10-11 digits)
    if (phone.length < 10 || phone.length > 11) {
      console.warn('Phone length out of range for Brazil:', phone.length);
      return;
    }
    
    // 3. Sanitize phone - remove any non-digit characters (defense in depth)
    const sanitizedPhone = phone.replace(/\D/g, '');

    console.log('Processing message from:', phone);

    // Check if it's an order-related message (contains keywords)
    const orderKeywords = ['pedido', 'comprar', 'quero', 'ovos', 'dúzia'];
    const isOrderMessage = orderKeywords.some(keyword => 
      messageText.toLowerCase().includes(keyword)
    );

    if (isOrderMessage) {
      // Find user by phone (using sanitized phone)
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('phone', sanitizedPhone)
        .single();

      if (profile) {
        // Create a draft order from WhatsApp
        const { error } = await supabase
          .from('orders')
          .insert({
            user_id: profile.user_id,
            customer_name: profile.full_name,
            phone: sanitizedPhone,
            status: 'whatsapp_pending',
            total: 0,
            items: [{ note: `Mensagem WhatsApp: ${messageText.substring(0, 500)}` }],
            delivery_address: '',
            delivery_neighborhood: '',
            delivery_city: '',
            whatsapp_message_id: payload.data.key.id,
            notes: `Pedido via WhatsApp - Aguardando confirmação`
          });

        if (error) {
          console.error('Error creating order:', error);
        } else {
          console.log('Order created successfully');
        }
      }
    }
  }
}