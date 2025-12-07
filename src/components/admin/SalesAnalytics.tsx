import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, ShoppingBag, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  dailyData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

const SalesAnalytics = () => {
  const [stats, setStats] = useState<SalesStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    dailyData: [],
  });
  const [filterPeriod, setFilterPeriod] = useState("7");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    loadSalesStats();
  }, [filterPeriod, customStartDate, customEndDate]);

  const loadSalesStats = async () => {
    let startDate: Date;
    let endDate: Date = endOfDay(new Date());

    if (filterPeriod === "custom" && customStartDate && customEndDate) {
      startDate = startOfDay(customStartDate);
      endDate = endOfDay(customEndDate);
    } else {
      startDate = startOfDay(subDays(new Date(), parseInt(filterPeriod)));
    }

    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (!orders) return;

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group by day
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyData = days.map((day) => {
      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.created_at);
        return (
          orderDate.getDate() === day.getDate() &&
          orderDate.getMonth() === day.getMonth() &&
          orderDate.getFullYear() === day.getFullYear()
        );
      });

      const dayRevenue = dayOrders.reduce(
        (sum, order) => sum + Number(order.total),
        0
      );

      return {
        date: format(day, "dd/MM", { locale: ptBR }),
        revenue: dayRevenue,
        orders: dayOrders.length,
      };
    });

    setStats({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      dailyData,
    });
  };

  const handlePeriodChange = (value: string) => {
    setFilterPeriod(value);
    if (value !== "custom") {
      setShowCustomDatePicker(false);
    } else {
      setShowCustomDatePicker(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Análise de Vendas</h2>
        <div className="flex gap-2 items-center">
          <Select value={filterPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Último mês</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {showCustomDatePicker && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate
                      ? format(customStartDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate
                      ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalRevenue.toFixed(2).replace(".", ",")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket Médio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.averageOrderValue.toFixed(2).replace(".", ",")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.dailyData.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div className="font-medium">{day.date}</div>
                <div className="flex gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Pedidos</p>
                    <p className="font-medium">{day.orders}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Faturamento</p>
                    <p className="font-medium">
                      R$ {day.revenue.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {stats.dailyData.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma venda no período
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAnalytics;
