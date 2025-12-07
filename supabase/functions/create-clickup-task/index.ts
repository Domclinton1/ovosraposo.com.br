import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface CreateTaskRequest {
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  address: string;
  neighborhood: string;
  city: string;
  phone: string;
  total: number;
  paymentMethod?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clickupToken = Deno.env.get('CLICKUP_API_TOKEN')!;
    const clickupListId = Deno.env.get('CLICKUP_LIST_ID')!;

    const { orderId, customerName, customerPhone, items, address, neighborhood, city, phone, total, paymentMethod }: CreateTaskRequest = await req.json();
    
    console.log('Creating ClickUp task for order:', orderId);

    // Formatar lista de itens com preços
    const itemsList = items.map(item => 
      `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    // Formatar descrição completa
    const description = `📦 PEDIDO #${orderId}

👤 Cliente: ${customerName}
📞 Telefone: ${customerPhone}

🛒 ITENS:
${itemsList}

📍 ENDEREÇO:
${address}
${neighborhood} - ${city}

💳 Pagamento: ${paymentMethod || 'Não informado'}
💰 Total: R$ ${total.toFixed(2)}`;

    // Criar título personalizado: "Pedido-[Nome]-[Telefone]"
    const taskTitle = `Pedido-${customerName}-${customerPhone}`;

    // Criar task no ClickUp
    const response = await fetch(`https://api.clickup.com/api/v2/list/${clickupListId}/task`, {
      method: 'POST',
      headers: {
        'Authorization': clickupToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: taskTitle,
        description: description,
        priority: 3,
      }),
    });

    const data = await response.json();
    console.log('ClickUp API response:', data);

    if (!response.ok) {
      throw new Error(`ClickUp API error: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, taskId: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating ClickUp task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
