import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    console.log("=== WEBHOOK MERCADO PAGO ===");
    console.log("Payload completo:", JSON.stringify(payload, null, 2));
    console.log("Tipo:", payload.type);
    console.log("Action:", payload.action);

    // Extrair payment_id de diferentes formatos do Mercado Pago
    let paymentId: string | null = null;

    // Tentar extrair de várias formas possíveis
    if (payload.data?.id) {
      paymentId = String(payload.data.id);
    } else if (payload.id) {
      paymentId = String(payload.id);
    } else if (payload.payment_id) {
      paymentId = String(payload.payment_id);
    } else if (payload.resource) {
      // Formato: /v1/payments/{id}
      const match = payload.resource.match(/\/payments\/(\d+)/);
      if (match) {
        paymentId = match[1];
      }
    }

    // Se não for notificação de pagamento ou não tiver ID, ignorar silenciosamente
    if (!paymentId || payload.type !== "payment") {
      console.log("⏭️ Ignorando notificação:", {
        type: payload.type,
        action: payload.action,
        hasId: !!paymentId
      });
      return new Response(JSON.stringify({ message: "Notification ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Payment ID extraído:", paymentId);

    const mercadoPagoToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mercadoPagoToken) {
      console.error("❌ Token do Mercado Pago não configurado");
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    // Buscar informações do pagamento na API do Mercado Pago
    console.log("📡 Buscando informações do pagamento na API...");
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mercadoPagoToken}`,
      },
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error("❌ Erro ao buscar pagamento:", errorText);
      throw new Error(`Failed to fetch payment: ${paymentResponse.status}`);
    }

    const paymentData = await paymentResponse.json();
    console.log("💰 Dados do pagamento:", {
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference,
      transaction_amount: paymentData.transaction_amount,
    });

    const orderId = paymentData.external_reference;

    if (!orderId) {
      console.error("❌ Order ID não encontrado no external_reference");
      console.log("⚠️ Ignorando notificação sem external_reference");
      return new Response(JSON.stringify({ message: "No external_reference, skipping" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("🔍 Buscando pedido no banco:", orderId);

    // Mapear status do Mercado Pago para status do pedido
    let orderStatus = "pending_payment";

    switch (paymentData.status) {
      case "approved":
        orderStatus = "new";
        console.log("✅ Pagamento APROVADO - Status: new");
        break;
      case "pending":
      case "in_process":
        orderStatus = "pending_payment";
        console.log("⏳ Pagamento PENDENTE");
        break;
      case "rejected":
      case "cancelled":
        orderStatus = "cancelled";
        console.log("❌ Pagamento REJEITADO/CANCELADO");
        break;
      default:
        console.log("⚠️ Status desconhecido:", paymentData.status);
        orderStatus = "pending_payment";
    }

    // Atualizar pedido no banco de dados
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Primeiro verificar se o pedido existe
    const { data: existingOrder, error: fetchError } = await supabaseClient
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Erro ao buscar pedido:", fetchError);
      throw fetchError;
    }

    if (!existingOrder) {
      console.error("❌ Pedido não encontrado no banco:", orderId);
      console.log("⚠️ Ignorando notificação de pedido inexistente");
      return new Response(JSON.stringify({ message: "Order not found, skipping" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Pedido encontrado:", existingOrder.id, "- Status atual:", existingOrder.status);

    // Atualizar pedido
    console.log("💾 Atualizando pedido para status:", orderStatus);
    const { data: updateData, error: updateError } = await supabaseClient
      .from("orders")
      .update({
        status: orderStatus,
        mercado_pago_payment_id: String(paymentId),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("❌ Erro ao atualizar pedido:", updateError);
      throw updateError;
    }

    console.log("✅ Pedido atualizado com sucesso!");
    console.log("Status final:", orderStatus);

    // Se pagamento aprovado, enviar para ClickUp
    if (orderStatus === "new") {
      console.log("📋 Criando task no ClickUp...");
      
      try {
        // Buscar dados completos do pedido para enviar ao ClickUp
        const { data: fullOrder, error: fetchFullError } = await supabaseClient
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (fetchFullError) {
          console.error("❌ Erro ao buscar pedido completo:", fetchFullError);
        } else if (fullOrder) {
          console.log("📦 Dados do pedido:", {
            customer: fullOrder.customer_name,
            phone: fullOrder.phone,
            items: fullOrder.items,
            total: fullOrder.total,
          });

          // Chamar função para criar task no ClickUp
          const clickupResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/create-clickup-task`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                orderId: fullOrder.id,
                customerName: fullOrder.customer_name,
                customerPhone: fullOrder.phone,
                items: fullOrder.items,
                address: fullOrder.delivery_address,
                neighborhood: fullOrder.delivery_neighborhood,
                city: fullOrder.delivery_city,
                phone: fullOrder.phone,
                total: fullOrder.total,
                paymentMethod: fullOrder.payment_method || "PIX",
              }),
            }
          );

          if (clickupResponse.ok) {
            const clickupData = await clickupResponse.json();
            console.log("✅ Task criada no ClickUp:", clickupData.taskId);
          } else {
            const errorText = await clickupResponse.text();
            console.error("❌ Erro ao criar task no ClickUp:", errorText);
          }
        }
      } catch (clickupError) {
        console.error("❌ Erro ao processar ClickUp:", clickupError);
        // Não falhar o webhook por causa do ClickUp
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        paymentId,
        status: orderStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("❌ Erro no webhook:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
