import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, MapPin, Phone, User, CreditCard } from "lucide-react";

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  delivery_address: string;
  delivery_neighborhood: string;
  delivery_city: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  payment_method: string;
  status: string;
  created_at: string;
}

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) throw error;

        setOrder(data as unknown as Order);
      } catch (error) {
        console.error('Erro ao buscar pedido:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemsCount={0} onCartClick={() => {}} />
        <main className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Pedido não encontrado</p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Voltar para Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const paymentMethodMap: Record<string, string> = {
    'pix': 'PIX',
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
    'dinheiro': 'Dinheiro',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={0} onCartClick={() => {}} />
      
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Pedido Confirmado!</h1>
            <p className="text-muted-foreground">
              Seu pedido foi recebido com sucesso
            </p>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Detalhes do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Número do Pedido</p>
                  <p className="font-semibold">{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-semibold">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Itens do Pedido</h3>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-semibold">
                        R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Delivery Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="w-4 h-4" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Nome</p>
                  <p className="font-semibold">{order.customer_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p>{order.phone}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="w-4 h-4" />
                  Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>{order.delivery_address}</p>
                <p>{order.delivery_neighborhood}</p>
                <p>{order.delivery_city}</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-4 h-4" />
                Forma de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">
                {paymentMethodMap[order.payment_method] || order.payment_method}
              </p>
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                📦 <strong>Próximos passos:</strong> Estamos preparando seu pedido! 
                Em breve você receberá uma confirmação via WhatsApp com mais detalhes sobre a entrega.
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/')} variant="outline">
              Voltar para Home
            </Button>
            <Button onClick={() => navigate('/produtos')}>
              Continuar Comprando
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
