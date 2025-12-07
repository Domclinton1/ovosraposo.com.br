import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, DollarSign, Package } from "lucide-react";

interface NeighborhoodStats {
  neighborhood: string;
  totalOrders: number;
  totalRevenue: number;
  averageRevenue: number;
  averageQuantity: number;
}

const NEIGHBORHOODS_MAP: Record<string, string> = {
  centro: "Centro",
  mosela: "Mosela",
  valparaiso: "Valparaíso",
  "alto-serra": "Alto da Serra",
  quitandinha: "Quitandinha",
  "alto-independencia": "Alto da Independência",
  bingen: "Bingen",
  "fazenda-inglesa": "Fazenda Inglesa",
  retiro: "Retiro",
  samambaia: "Samambaia",
  correas: "Corrêas",
  quissama: "Quissamã",
  cascatinha: "Cascatinha",
  nogueira: "Nogueira",
  itaipava: "Itaipava",
  "vale-cuiaba": "Vale do Cuiabá",
  "pedro-rio": "Pedro do Rio",
};

const NeighborhoodAnalytics = () => {
  const [stats, setStats] = useState<NeighborhoodStats[]>([]);

  useEffect(() => {
    loadNeighborhoodStats();
  }, []);

  const loadNeighborhoodStats = async () => {
    const { data: orders } = await supabase
      .from("orders")
      .select("delivery_neighborhood, total, items");

    if (!orders) return;

    // Group by neighborhood
    const neighborhoodMap = new Map<string, NeighborhoodStats>();

    orders.forEach((order) => {
      const neighborhood = order.delivery_neighborhood;
      if (!neighborhood) return;

      const current = neighborhoodMap.get(neighborhood) || {
        neighborhood,
        totalOrders: 0,
        totalRevenue: 0,
        averageRevenue: 0,
        averageQuantity: 0,
      };

      // Calculate total quantity from items
      const items = order.items as Array<{ cartQuantity: number }>;
      const quantity = items.reduce((sum, item) => sum + item.cartQuantity, 0);

      current.totalOrders += 1;
      current.totalRevenue += Number(order.total);

      neighborhoodMap.set(neighborhood, current);
    });

    // Calculate averages and sort by revenue
    const statsArray = Array.from(neighborhoodMap.values())
      .map((stat) => ({
        ...stat,
        averageRevenue: stat.totalRevenue / stat.totalOrders,
        averageQuantity:
          orders
            .filter((o) => o.delivery_neighborhood === stat.neighborhood)
            .reduce((sum, o) => {
              const items = o.items as Array<{ cartQuantity: number }>;
              return (
                sum + items.reduce((s, item) => s + item.cartQuantity, 0)
              );
            }, 0) / stat.totalOrders,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    setStats(statsArray);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Análise por Bairros</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.neighborhood}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-4 w-4 text-primary" />
                {NEIGHBORHOODS_MAP[stat.neighborhood] || stat.neighborhood}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pedidos</span>
                <span className="font-semibold">{stat.totalOrders}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Faturamento Total
                </span>
                <span className="font-semibold">
                  R$ {stat.totalRevenue.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Valor Médio
                </span>
                <span className="font-semibold text-primary">
                  R$ {stat.averageRevenue.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Quantidade Média
                </span>
                <span className="font-semibold">
                  {stat.averageQuantity.toFixed(0)} dúzias
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {stats.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Nenhum dado de vendas disponível
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NeighborhoodAnalytics;
