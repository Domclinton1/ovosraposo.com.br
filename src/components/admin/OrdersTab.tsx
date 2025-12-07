import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Input } from "@/components/ui/input";

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  delivery_address: string;
  delivery_neighborhood: string;
  delivery_city: string;
  status: "new" | "pending_payment" | "in_transit" | "delivered" | "cancelled";
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  created_at: string;
}

const OrdersTab = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("7");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          console.log('Order changed, reloading...');
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterOrdersByDate();
  }, [orders, dateFilter, customStartDate, customEndDate]);

  const loadOrders = async () => {
    console.log("🔄 Carregando pedidos...");
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("❌ Usuário não autenticado");
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado para acessar os pedidos.",
        variant: "destructive",
      });
      return;
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    console.log("👤 Usuário é admin:", isAdmin);

    let data, error;

    if (isAdmin) {
      // Admin can query orders directly
      const result = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      
      data = result.data;
      error = result.error;
    } else {
      // Non-admin staff must use get_masked_orders function
      const result = await supabase.rpc('get_masked_orders');
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("❌ Erro ao carregar pedidos:", error);
      toast({
        title: "Erro ao carregar pedidos",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Pedidos carregados:", data?.length || 0);
    if (data && data.length > 0) {
      console.log("📦 Primeiro pedido:", data[0]);
    }

    setOrders((data as unknown as Order[]) || []);
  };

  const filterOrdersByDate = () => {
    if (!orders.length) return;

    let filtered = [...orders];
    const now = new Date();

    if (dateFilter === "custom") {
      if (customStartDate && customEndDate) {
        const start = startOfDay(new Date(customStartDate));
        const end = endOfDay(new Date(customEndDate));
        filtered = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= start && orderDate <= end;
        });
      }
    } else {
      const days = parseInt(dateFilter);
      const startDate = startOfDay(subDays(now, days));
      filtered = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startDate;
      });
    }

    setFilteredOrders(filtered);
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      new: { label: "Novo", className: "bg-blue-500/10 text-blue-500" },
      pending_payment: { label: "Aguardando Pagamento", className: "bg-yellow-500/10 text-yellow-500" },
      in_transit: { label: "A Caminho", className: "bg-purple-500/10 text-purple-500" },
      delivered: { label: "Entregue", className: "bg-green-500/10 text-green-500" },
      cancelled: { label: "Cancelado", className: "bg-red-500/10 text-red-500" },
    };
    
    const config = statusConfig[status] || statusConfig.new;
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{order.customer_name}</CardTitle>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-sm text-muted-foreground">{order.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">
              R$ {order.total.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <p className="text-sm">
            <strong>Endereço:</strong> {order.delivery_address}
          </p>
          <p className="text-sm">
            <strong>Bairro:</strong> {order.delivery_neighborhood}
          </p>
          <p className="text-sm">
            <strong>Cidade:</strong> {order.delivery_city}
          </p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-semibold">Itens:</p>
          {order.items.map((item, idx) => (
            <p key={idx} className="text-sm text-muted-foreground">
              {item.quantity}x {item.name} - R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Filtro de Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrar por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Último mês</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateFilter === "custom" && (
              <>
                <div className="flex-1">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    placeholder="Data inicial"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    placeholder="Data final"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Pedidos no Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-4">
            <div className="text-3xl font-bold">{filteredOrders.length}</div>
            <div className="text-sm text-muted-foreground">
              Total: R$ {filteredOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2).replace(".", ",")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum pedido encontrado no período selecionado.
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map(renderOrderCard)
        )}
      </div>
    </div>
  );
};

export default OrdersTab;
