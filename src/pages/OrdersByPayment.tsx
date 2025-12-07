import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Smartphone, CreditCard, Wallet, Banknote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  delivery_address: string;
  delivery_neighborhood: string;
  delivery_city: string;
  status: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  created_at: string;
  payment_method?: string;
}

const OrdersByPayment = () => {
  const { paymentMethod } = useParams<{ paymentMethod: string }>();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('payment-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          console.log('💳 Pedido alterado, recarregando lista de pagamentos...');
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [paymentMethod]);

  const loadOrders = async () => {
    setLoading(true);
    console.log(`💳 Carregando pedidos para: ${paymentMethod}`);
    
    let query = supabase
      .from("orders")
      .select("*")
      .neq("status", "pending_payment")
      .neq("status", "cancelled");
    
    // Se o método for 'cash', buscar tanto 'cash' quanto NULL
    if (paymentMethod === 'cash') {
      query = query.or(`payment_method.eq.${paymentMethod},payment_method.is.null`);
      console.log("💵 Buscando pedidos em dinheiro (incluindo NULL)");
    } else {
      query = query.eq("payment_method", paymentMethod);
      console.log(`💳 Buscando pedidos: ${paymentMethod}`);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Erro ao carregar pedidos:", error);
    } else {
      console.log(`✅ ${data?.length || 0} pedidos encontrados`);
      if (data && data.length > 0) {
        console.log("📦 Pedidos:", data.map(o => ({
          id: o.id.slice(0, 8),
          customer: o.customer_name,
          payment: o.payment_method || 'NULL',
          total: o.total
        })));
      }
      setOrders((data as unknown as Order[]) || []);
    }
    setLoading(false);
  };

  const getPaymentMethodInfo = () => {
    const methodMap: Record<string, { label: string; icon: any; color: string }> = {
      pix: { label: "Pix", icon: Smartphone, color: "text-teal-500" },
      credit_card: { label: "Crédito", icon: CreditCard, color: "text-blue-500" },
      debit_card: { label: "Débito", icon: Wallet, color: "text-purple-500" },
      cash: { label: "Dinheiro", icon: Banknote, color: "text-green-500" },
    };
    return methodMap[paymentMethod || ""] || { label: paymentMethod, icon: CreditCard, color: "text-gray-500" };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const info = getPaymentMethodInfo();
  const Icon = info.icon;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartItemsCount={0} onCartClick={() => {}} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Icon className={`h-6 w-6 ${info.color}`} />
              <h1 className="text-3xl font-bold">Pedidos - {info.label}</h1>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{orders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  R$ {totalRevenue.toFixed(2).replace(".", ",")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ticket Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  R$ {orders.length > 0 ? (totalRevenue / orders.length).toFixed(2).replace(".", ",") : "0,00"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Carregando pedidos...</p>
              ) : orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pedido pago encontrado com esta forma de pagamento.
                </p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div key={order.id} className="border-b pb-2 last:border-b-0">
                      <p className="text-sm">
                        <strong>{order.customer_name}</strong> - {" "}
                        {order.items.map((item, idx) => (
                          <span key={idx}>
                            {idx > 0 && ", "}
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                        {" "} - <strong className="text-primary">R$ {order.total.toFixed(2).replace(".", ",")}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(order.created_at)} • {order.delivery_neighborhood}, {order.delivery_city}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrdersByPayment;
