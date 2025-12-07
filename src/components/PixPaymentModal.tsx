import { X, Copy, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string;
  qrCodeBase64?: string;
  totalAmount: number;
  paymentId: string;
  orderId: string;
}

const PixPaymentModal = ({ 
  isOpen, 
  onClose, 
  qrCode, 
  qrCodeBase64, 
  totalAmount,
  paymentId,
  orderId
}: PixPaymentModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!isOpen || !orderId) return;

    const checkPaymentStatus = async () => {
      try {
        console.log('🔄 [PIX Modal] Verificando status do pedido:', orderId);
        
        const { data, error } = await supabase
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .single();

        if (error) {
          console.error('❌ [PIX Modal] Erro ao verificar status:', error);
          return;
        }

        console.log('📊 [PIX Modal] Status atual do pedido:', data?.status);

        if (data?.status === 'new') {
          console.log('✅ [PIX Modal] Pagamento aprovado! Redirecionando...');
          setPaymentStatus('approved');
          toast({
            title: "✅ Pagamento confirmado!",
            description: "Redirecionando...",
            duration: 3000,
          });
          
          setTimeout(() => {
            console.log('🚀 [PIX Modal] Navegando para página de confirmação');
            navigate(`/pedido-confirmado?order_id=${orderId}`);
          }, 2000);
        } else if (data?.status === 'rejected' || data?.status === 'cancelled') {
          console.log('❌ [PIX Modal] Pagamento rejeitado/cancelado');
          setPaymentStatus('rejected');
          toast({
            title: "❌ Pagamento não confirmado",
            description: "Tente novamente ou escolha outra forma de pagamento.",
            variant: "destructive",
          });
        } else {
          console.log('⏳ [PIX Modal] Aguardando pagamento... Status:', data?.status);
        }
      } catch (error) {
        console.error('❌ [PIX Modal] Erro no polling:', error);
      }
    };

    // Verificar a cada 5 segundos
    const interval = setInterval(checkPaymentStatus, 5000);
    
    // Verificar imediatamente também
    checkPaymentStatus();

    // Limpar interval ao desmontar
    return () => clearInterval(interval);
  }, [isOpen, orderId, navigate, toast]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast({
        title: "✅ Código copiado!",
        description: "Cole no app do seu banco para pagar.",
        duration: 3000,
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Tente selecionar o código manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleManualCheck = async () => {
    setChecking(true);
    console.log('👆 [PIX Modal] Verificação manual iniciada');
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      console.log('🔍 [PIX Modal] Status verificado manualmente:', data?.status);

      if (data?.status === 'new') {
        console.log('✅ [PIX Modal] Pagamento confirmado manualmente!');
        setPaymentStatus('approved');
        toast({
          title: "✅ Pagamento confirmado!",
          description: "Redirecionando...",
        });
        setTimeout(() => {
          navigate(`/pedido-confirmado?order_id=${orderId}`);
        }, 1500);
      } else {
        console.log('⏳ [PIX Modal] Pagamento ainda pendente:', data?.status);
        toast({
          title: "⏳ Aguardando pagamento",
          description: "O pagamento ainda não foi confirmado.",
        });
      }
    } catch (error) {
      console.error('❌ [PIX Modal] Erro na verificação manual:', error);
      toast({
        title: "Erro ao verificar",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg my-auto">
        <Card className="w-full bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              {paymentStatus === 'approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
              Pagamento PIX
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              disabled={paymentStatus === 'approved'}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6">
          {/* Status do Pagamento */}
          {paymentStatus === 'approved' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800 dark:text-green-200">
                Pagamento Confirmado!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Redirecionando...
              </p>
            </div>
          )}

          {paymentStatus === 'pending' && (
            <>
              {/* Valor */}
              <div className="text-center space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">Valor a pagar</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  R$ {totalAmount.toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* QR Code */}
              {qrCodeBase64 && (
                <div className="bg-white p-3 sm:p-4 rounded-lg flex justify-center">
                  <img 
                    src={`data:image/png;base64,${qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 max-w-full"
                  />
                </div>
              )}

              {/* Instruções */}
              <div className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-2">
                <p className="font-semibold text-xs sm:text-sm">Como pagar:</p>
                <ol className="text-xs sm:text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar com PIX</li>
                  <li>Escaneie o QR Code acima</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </div>

              {/* Código PIX (Pix Copia e Cola) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm font-semibold">Ou copie o código:</p>
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted/50 p-2 sm:p-3 rounded-lg break-all text-[10px] sm:text-xs font-mono max-h-24 overflow-y-auto">
                  {qrCode}
                </div>
              </div>

              {/* ID do Pagamento */}
              <p className="text-xs text-center text-muted-foreground">
                ID do pagamento: {paymentId}
              </p>

              {/* Aviso */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 sm:p-3 flex items-start gap-2">
                <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-blue-600 mt-0.5" />
                <p className="text-[10px] sm:text-xs text-blue-800 dark:text-blue-200">
                  Aguardando confirmação do pagamento... Verificando automaticamente a cada 5 segundos.
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2">
                <Button 
                  onClick={handleManualCheck}
                  variant="default"
                  className="w-full text-sm sm:text-base"
                  disabled={checking}
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Já paguei - Verificar agora"
                  )}
                </Button>
              </div>
            </>
          )}

          <Button 
            onClick={onClose}
            variant="outline"
            className="w-full text-sm sm:text-base"
            disabled={paymentStatus === 'approved'}
          >
            {paymentStatus === 'approved' ? 'Aguarde...' : 'Fechar'}
          </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PixPaymentModal;
