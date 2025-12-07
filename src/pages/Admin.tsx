import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrdersTab from "@/components/admin/OrdersTab";
import CustomersTab from "@/components/admin/CustomersTab";
import SalesTab from "@/components/admin/SalesTab";
import MercadoPagoTest from "@/components/admin/MercadoPagoTest";

import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Verificar se o usuário tem role de admin
      const { data: hasAdminRole, error } = await supabase
        .rpc('has_role', { 
          _user_id: session.user.id, 
          _role: 'admin' 
        });

      if (error) {
        console.error("Erro ao verificar role:", error);
        toast({
          title: "Erro de autenticação",
          description: "Não foi possível verificar suas permissões.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      if (!hasAdminRole) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta página.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Erro na autenticação:", error);
      navigate("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background ">
      <Header cartItemsCount={0} onCartClick={() => {}} />
      
      <main className="container mx-auto px-4 py-8 ">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
            <p className="text-muted-foreground">Gestão de Pedidos e Análises</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="customers">Clientes</TabsTrigger>
            <TabsTrigger value="sales">Resumo de Vendas</TabsTrigger>
            <TabsTrigger value="mercadopago">Mercado Pago</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>

          <TabsContent value="customers">
            <CustomersTab />
          </TabsContent>

          <TabsContent value="sales">
            <SalesTab />
          </TabsContent>

          <TabsContent value="mercadopago">
            <MercadoPagoTest />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default Admin;
