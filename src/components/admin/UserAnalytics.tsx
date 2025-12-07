import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar as CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  users: Array<{
    id: string;
    full_name: string;
    email: string;
    phone: string;
    created_at: string;
    last_order_date: string | null;
    total_orders: number;
  }>;
}

const UserAnalytics = () => {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    users: [],
  });
  const [filterPeriod, setFilterPeriod] = useState("7");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    loadUserStats();
  }, [filterPeriod, customStartDate, customEndDate]);

  const loadUserStats = async () => {
    let dateThreshold: Date;

    if (filterPeriod === "custom" && customStartDate && customEndDate) {
      dateThreshold = startOfDay(customStartDate);
    } else {
      dateThreshold = startOfDay(subDays(new Date(), parseInt(filterPeriod)));
    }

    try {
      // Get customers from edge function
      const { data: customersData, error: customersError } = await supabase.functions.invoke('manage-users', {
        body: { action: 'listCustomers' }
      });

      if (customersError) throw customersError;

      const customers = customersData.customers || [];

      // Get orders for each customer
      const usersWithOrders = await Promise.all(
        customers.map(async (customer: any) => {
          const { data: orders } = await supabase
            .from("orders")
            .select("created_at")
            .eq("user_id", customer.id)
            .order("created_at", { ascending: false });

          const lastOrder = orders?.[0];
          const totalOrders = orders?.length || 0;

          return {
            id: customer.id,
            full_name: customer.profile?.full_name || customer.email?.split('@')[0] || 'Sem nome',
            email: customer.email || '',
            phone: customer.profile?.phone || '',
            created_at: customer.profile?.created_at || '',
            last_order_date: lastOrder?.created_at || null,
            total_orders: totalOrders,
          };
        })
      );

      // Calculate stats based on filter
      const activeUsers = usersWithOrders.filter((user) => {
        if (!user.last_order_date) return false;
        const lastOrderDate = new Date(user.last_order_date);
        return lastOrderDate >= dateThreshold;
      });

      setStats({
        totalUsers: customers.length,
        activeUsers: activeUsers.length,
        inactiveUsers: customers.length - activeUsers.length,
        users: usersWithOrders.sort((a, b) => {
          const dateA = a.last_order_date ? new Date(a.last_order_date).getTime() : 0;
          const dateB = b.last_order_date ? new Date(b.last_order_date).getTime() : 0;
          return dateB - dateA;
        }),
      });
    } catch (error) {
      console.error("Error loading customer stats:", error);
    }
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
        <h2 className="text-2xl font-bold">Análise de Clientes</h2>
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
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Compraram no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Inativos</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.inactiveUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Sem compras no período
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {user.total_orders} pedido{user.total_orders !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.last_order_date
                      ? `Último: ${format(
                          new Date(user.last_order_date),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}`
                      : "Sem pedidos"}
                  </p>
                </div>
              </div>
            ))}

            {stats.users.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum cliente encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAnalytics;
