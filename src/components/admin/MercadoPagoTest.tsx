import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  success: boolean;
  message?: string;
  tokenLength?: number;
  paymentMethodsAvailable?: number;
  environment?: string;
  error?: string;
  hint?: string;
}

const MercadoPagoTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testingPayment, setTestingPayment] = useState(false);
  const { toast } = useToast();

  const handleTest = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      console.log("Testando conexão com Mercado Pago...");
      
      const { data, error } = await supabase.functions.invoke('test-mercado-pago');

      if (error) {
        console.error("Erro ao testar Mercado Pago:", error);
        setTestResult({
          success: false,
          error: error.message || "Erro ao conectar com a função de teste",
        });
        return;
      }

      console.log("Resultado do teste:", data);
      setTestResult(data);
    } catch (err) {
      console.error("Erro inesperado:", err);
      setTestResult({
        success: false,
        error: "Erro inesperado ao executar o teste",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestClickUp = async () => {
    setIsLoading(true);
    
    try {
      console.log("Enviando pedido de teste ao ClickUp...");
      
      const { data, error } = await supabase.functions.invoke('test-clickup');

      if (error) {
        console.error("Erro ao testar ClickUp:", error);
        toast({
          title: "❌ Erro no teste",
          description: error.message || 'Erro ao enviar teste ao ClickUp',
          variant: "destructive",
        });
        return;
      }

      console.log("Resultado do teste ClickUp:", data);
      toast({
        title: "✅ Pedido enviado com sucesso!",
        description: "Verifique o ClickUp para ver a task de teste criada.",
      });
    } catch (err) {
      console.error("Erro inesperado:", err);
      toast({
        title: "❌ Erro no teste",
        description: 'Erro inesperado ao enviar teste ao ClickUp',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPixPayment = async () => {
    setTestingPayment(true);
    
    try {
      console.log("🧪 Criando pedido de teste PIX R$ 0,30...");
      
      // Verificar se usuário está logado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "❌ Erro",
          description: "Você precisa estar logado para testar pagamentos",
          variant: "destructive",
        });
        return;
      }

      // Criar pedido de teste
      const testOrder = {
        user_id: user.id,
        customer_name: "Teste PIX",
        phone: "24999999999",
        delivery_address: "Endereço de Teste, 123",
        delivery_city: "Teresópolis",
        delivery_neighborhood: "Centro",
        items: [{ name: "Teste PIX", price: 0.30, quantity: 1, cartQuantity: 1 }],
        total: 0.30,
        payment_method: "pix_online",
        status: "pending_payment",
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select()
        .single();

      if (orderError) throw orderError;

      console.log("📦 Pedido de teste criado:", order.id);

      // Criar pagamento PIX
      const { data: session } = await supabase.auth.getSession();
      
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment-preference',
        {
          headers: {
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
          body: {
            items: testOrder.items,
            orderId: order.id,
            customerInfo: {
              name: testOrder.customer_name,
              email: user.email,
              phone: testOrder.phone,
            },
            paymentMethod: 'pix',
            totalAmount: testOrder.total,
          },
        }
      );

      if (paymentError) throw paymentError;

      console.log("💳 Pagamento PIX criado:", paymentData);

      toast({
        title: "✅ Teste PIX criado!",
        description: `Pedido #${order.id} - QR Code gerado`,
        duration: 5000,
      });

      // Copiar QR Code
      if (paymentData.qrCode) {
        await navigator.clipboard.writeText(paymentData.qrCode);
        toast({
          title: "📋 QR Code copiado!",
          description: "Cole no app do banco para testar",
          duration: 3000,
        });
      }

    } catch (err: any) {
      console.error("❌ Erro no teste PIX:", err);
      toast({
        title: "❌ Erro no teste PIX",
        description: err.message || 'Erro ao criar teste de pagamento PIX',
        variant: "destructive",
      });
    } finally {
      setTestingPayment(false);
    }
  };

  const handleTestCardPayment = async () => {
    setTestingPayment(true);
    
    try {
      console.log("🧪 Criando pedido de teste Cartão R$ 1,00...");
      
      toast({
        title: "⚠️ Teste de Cartão",
        description: "Para testar cartão, use o fluxo normal do site com R$ 1,00 e dados de teste do Mercado Pago",
        duration: 8000,
      });

    } catch (err: any) {
      console.error("❌ Erro no teste Cartão:", err);
      toast({
        title: "❌ Erro",
        description: err.message || 'Erro ao preparar teste',
        variant: "destructive",
      });
    } finally {
      setTestingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Conexão Mercado Pago</CardTitle>
          <CardDescription>
            Verifique se as credenciais do Mercado Pago estão configuradas corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Button 
              onClick={handleTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Testando..." : "Testar Conexão Mercado Pago"}
            </Button>

            <Button 
              onClick={handleTestClickUp} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Enviando..." : "📋 Enviar Pedido Teste ao ClickUp"}
            </Button>

            <div className="border-t pt-3 mt-2">
              <p className="text-sm font-semibold mb-3 text-muted-foreground">Testes de Pagamento Real:</p>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleTestPixPayment} 
                  disabled={testingPayment}
                  variant="secondary"
                  className="w-full"
                >
                  {testingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  💰 PIX R$ 0,30
                </Button>

                <Button 
                  onClick={handleTestCardPayment} 
                  disabled={testingPayment}
                  variant="secondary"
                  className="w-full"
                >
                  {testingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  💳 Cartão R$ 1,00
                </Button>
              </div>
            </div>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <div className="flex-1 space-y-2">
                  <AlertTitle className="text-lg">
                    {testResult.success ? "✅ Conexão Bem-Sucedida!" : "❌ Falha na Conexão"}
                  </AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{testResult.message || testResult.error}</p>
                    
                    {testResult.success && (
                      <div className="space-y-1 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Ambiente:</span>
                          <Badge variant={testResult.environment === 'PRODUCTION' ? 'default' : 'secondary'}>
                            {testResult.environment === 'PRODUCTION' ? '🟢 Produção' : '🟡 Sandbox'}
                          </Badge>
                        </div>
                        <p>
                          <span className="font-semibold">Tamanho do Token:</span> {testResult.tokenLength} caracteres
                        </p>
                        <p>
                          <span className="font-semibold">Métodos de Pagamento:</span> {testResult.paymentMethodsAvailable} disponíveis
                        </p>
                      </div>
                    )}

                    {testResult.hint && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                        <div className="flex gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">{testResult.hint}</p>
                        </div>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Configuração do Webhook</CardTitle>
          <CardDescription>
            Siga estas instruções para configurar o webhook no Mercado Pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                Acesse:{" "}
                <a 
                  href="https://www.mercadopago.com.br/developers/panel/app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Painel de Desenvolvedores do Mercado Pago
                </a>
              </li>
              <li>Selecione sua aplicação</li>
              <li>Vá em "Webhooks"</li>
              <li>
                Adicione a URL:
                <div className="mt-2 p-3 bg-muted rounded-md font-mono text-xs break-all">
                  https://hcqsokycqfhwpfrtugnh.supabase.co/functions/v1/mercado-pago-webhook
                </div>
              </li>
              <li>Selecione eventos: <Badge>payment.created</Badge> e <Badge>payment.updated</Badge></li>
              <li>Salve a configuração</li>
            </ol>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>⚠️ Secrets do Supabase</AlertTitle>
              <AlertDescription className="space-y-2 mt-2">
                <p className="text-sm">Certifique-se de que os seguintes secrets estão configurados:</p>
                <div className="space-y-1 text-xs font-mono bg-muted p-3 rounded-md">
                  <div>• MERCADO_PAGO_ACCESS_TOKEN</div>
                  <div>• MERCADO_PAGO_WEBHOOK_SECRET</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure-os acessando o painel do Lovable Cloud → Edge Functions → Secrets
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MercadoPagoTest;
