import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, DollarSign, Package, CreditCard, Smartphone, Banknote, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Order {
  id: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  delivery_neighborhood: string;
  created_at: string;
  status: string;
  payment_method?: string;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

const SalesTab = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Array<{ name: string; quantity: number }>>([]);
  const [neighborhoodSales, setNeighborhoodSales] = useState<Array<{ name: string; total: number }>>([]);
  const [avgTicket, setAvgTicket] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [paymentMethodStats, setPaymentMethodStats] = useState<Array<{ method: string; count: number; total: number }>>([]);

  useEffect(() => {
    loadSalesData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('sales-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          console.log('📊 Pedido alterado, recarregando dados de vendas...');
          loadSalesData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSalesData = async () => {
    console.log("📊 Carregando dados de vendas...");
    
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Erro ao carregar pedidos:", error);
      return;
    }

    console.log("✅ Total de pedidos no banco:", data?.length || 0);

    const ordersData = (data as unknown as Order[]) || [];
    
    // Filtrar apenas pedidos pagos (status diferente de pending_payment e cancelled)
    const paidOrders = ordersData.filter(order => 
      order.status !== 'pending_payment' && order.status !== 'cancelled'
    );
    
    console.log("💰 Pedidos pagos (após filtro):", paidOrders.length);
    console.log("📋 Status dos pedidos:", ordersData.map(o => ({ 
      id: o.id.slice(0, 8), 
      status: o.status, 
      payment: o.payment_method || 'NULL',
      total: o.total 
    })));
    
    setOrders(paidOrders);

    // Calcular produtos mais vendidos (apenas pedidos pagos)
    const productsMap = new Map<string, number>();
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        const current = productsMap.get(item.name) || 0;
        productsMap.set(item.name, current + item.quantity);
      });
    });
    
    const sortedProducts = Array.from(productsMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    setTopProducts(sortedProducts);

    // Calcular vendas por bairro (apenas pedidos pagos)
    const neighborhoodMap = new Map<string, number>();
    paidOrders.forEach(order => {
      const current = neighborhoodMap.get(order.delivery_neighborhood) || 0;
      neighborhoodMap.set(order.delivery_neighborhood, current + order.total);
    });
    
    const sortedNeighborhoods = Array.from(neighborhoodMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    setNeighborhoodSales(sortedNeighborhoods);

    // Calcular estatísticas por forma de pagamento (apenas pedidos pagos)
    const paymentMap = new Map<string, { count: number; total: number }>();
    paidOrders.forEach(order => {
      const method = order.payment_method || 'cash'; // Tratar NULL como cash
      const current = paymentMap.get(method) || { count: 0, total: 0 };
      paymentMap.set(method, {
        count: current.count + 1,
        total: current.total + order.total
      });
    });
    
    const paymentStats = Array.from(paymentMap.entries())
      .map(([method, stats]) => ({ method, ...stats }));
    
    console.log("💳 Estatísticas de pagamento:", paymentStats);
    
    setPaymentMethodStats(paymentStats);

    // Calcular ticket médio e receita total (apenas pedidos pagos)
    const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    setTotalRevenue(revenue);
    setTotalOrders(paidOrders.length);
    setAvgTicket(paidOrders.length > 0 ? revenue / paidOrders.length : 0);
  };

  const getPaymentMethodInfo = (method: string) => {
    const methodMap: Record<string, { label: string; icon: any; color: string }> = {
      pix: { label: "Pix", icon: Smartphone, color: "text-teal-500" },
      credit_card: { label: "Crédito", icon: CreditCard, color: "text-blue-500" },
      debit_card: { label: "Débito", icon: Wallet, color: "text-purple-500" },
      cash: { label: "Dinheiro", icon: Banknote, color: "text-green-500" },
    };
    return methodMap[method] || { label: method, icon: CreditCard, color: "text-gray-500" };
  };

  const handlePaymentMethodClick = (method: string) => {
    navigate(`/admin/orders/${method}`);
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
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
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R$ {avgTicket.toFixed(2).replace(".", ",")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Formas de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Formas de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['pix', 'credit_card', 'debit_card', 'cash'].map((method) => {
              const stat = paymentMethodStats.find(s => s.method === method);
              const info = getPaymentMethodInfo(method);
              const Icon = info.icon;
              
              return (
                <Card 
                  key={method} 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => stat && stat.count > 0 && handlePaymentMethodClick(method)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${info.color}`} />
                      {info.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat?.count || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      R$ {(stat?.total || 0).toFixed(2).replace(".", ",")}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Produtos Mais Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#FF6B6B" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum dado disponível
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Vendas por Bairro */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Bairro</CardTitle>
        </CardHeader>
        <CardContent>
          {neighborhoodSales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={neighborhoodSales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {neighborhoodSales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum dado disponível
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesTab;
