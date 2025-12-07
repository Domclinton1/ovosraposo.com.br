import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactPixel from "react-facebook-pixel";
import Header from "@/components/Header";
import ProductsSection, { type Product } from "@/components/ProductsSection";
import Footer from "@/components/Footer";
import CartModal, { type QuickCheckoutData } from "@/components/CartModal";
import CheckoutForm, { type CheckoutFormData } from "@/components/CheckoutForm";
import PixPaymentModal from "@/components/PixPaymentModal";

interface CartItem extends Product {
  cartQuantity: number;
}

const Products = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isCheckoutFormOpen, setIsCheckoutFormOpen] = useState(false);
  const [pixPaymentData, setPixPaymentData] = useState<{
    qrCode: string;
    qrCodeBase64?: string;
    totalAmount: number;
    paymentId: string;
    orderId: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    ReactPixel.track('ViewContent', {
      content_type: 'product_group',
      content_name: 'Products Page - Ovos Raposo'
    });
  }, []);

  const getTotalItemsInCart = () => {
    return cartItems.reduce((sum, item) => sum + item.cartQuantity, 0);
  };

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, cartQuantity: 1 }];
      }
    });

    ReactPixel.track('AddToCart', {
      content_name: product.name,
      content_ids: [product.id.toString()],
      content_type: 'product',
      value: product.price,
      currency: 'BRL'
    });
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, cartQuantity: newQuantity }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const handleCartClick = () => {
    setIsCartModalOpen(true);
  };

  const handleCheckout = async (quickCheckoutData?: QuickCheckoutData) => {
    try {
      const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
      
      ReactPixel.track('InitiateCheckout', {
        content_ids: cartItems.map(item => item.id.toString()),
        contents: cartItems.map(item => ({
          id: item.id.toString(),
          quantity: item.cartQuantity
        })),
        num_items: cartItems.reduce((sum, item) => sum + item.cartQuantity, 0),
        value: totalPrice,
        currency: 'BRL'
      });

      const { data: { session } } = await supabase.auth.getSession();
      
      if (quickCheckoutData) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const { data: { session: newSession } } = await supabase.auth.getSession();
        
        if (!newSession) {
          toast({
            title: "Erro de autenticação",
            description: "Não foi possível completar o cadastro. Tente novamente.",
            variant: "destructive",
          });
          return;
        }

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', newSession.user.id)
          .maybeSingle();

        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: newSession.user.id,
              full_name: quickCheckoutData.name,
              phone: quickCheckoutData.phone,
              email: newSession.user.email || quickCheckoutData.phone,
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            toast({
              title: "Erro ao salvar perfil",
              description: "Ocorreu um erro. Tente novamente.",
              variant: "destructive",
            });
            return;
          }
        }

        const { error: addressError } = await supabase
          .from("delivery_addresses")
          .insert({
            user_id: newSession.user.id,
            address: quickCheckoutData.address,
            neighborhood: quickCheckoutData.neighborhood,
            city: quickCheckoutData.city,
            is_primary: true,
          });

        if (addressError) {
          console.error('Error saving address:', addressError);
        }

        setIsCartModalOpen(false);
        setIsCheckoutFormOpen(true);
        return;
      }
      
      if (!session) {
        return;
      }
      
      setIsCartModalOpen(false);
      setIsCheckoutFormOpen(true);
    } catch (error) {
      console.error('Error in checkout:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCheckoutSubmit = async (formData: CheckoutFormData) => {
    try {
      console.log('=== CHECKOUT SUBMIT - START ===');
      console.log('Form Data Received:', {
        ...formData,
        cardToken: formData.cardToken ? '***EXISTS***' : 'MISSING',
        paymentMethodId: formData.paymentMethodId || 'MISSING',
        issuerId: formData.issuerId || 'MISSING',
      });
      
      const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
      
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para finalizar o pedido.",
          variant: "destructive",
        });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', session.user.id)
        .single();

      const customerName = profile?.full_name || formData.name;
      const customerPhone = profile?.phone || formData.phone;

      const isMercadoPago = ['pix', 'debit_card', 'credit_card'].includes(formData.paymentMethod);

      const paymentMethodMap: Record<string, string> = {
        'pix': 'pix',
        'debit_card': 'debit_card',
        'credit_card': 'credit_card',
        'dinheiro': 'cash'
      };

      const mappedPaymentMethod = paymentMethodMap[formData.paymentMethod] || 'cash';

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: session.user.id,
          customer_name: customerName,
          phone: customerPhone,
          delivery_address: formData.address,
          delivery_neighborhood: formData.neighborhood,
          delivery_city: formData.city,
          status: isMercadoPago ? "pending_payment" : "new",
          payment_method: mappedPaymentMethod,
          total: totalPrice,
          items: cartItems.map(item => ({
            name: item.name,
            quantity: item.cartQuantity,
            price: item.price
          }))
        })
        .select()
        .single();

      if (orderError) throw orderError;

      ReactPixel.track('Purchase', {
        content_ids: cartItems.map(item => item.id.toString()),
        contents: cartItems.map(item => ({
          id: item.id.toString(),
          quantity: item.cartQuantity
        })),
        value: totalPrice,
        currency: 'BRL',
        transaction_id: order.id
      });

      if (isMercadoPago) {
        try {
          const paymentMethodMap: Record<string, string> = {
            'pix': 'pix',
            'debit_card': 'debit_card',
            'credit_card': 'credit_card',
          };

          const mappedPaymentMethod = paymentMethodMap[formData.paymentMethod];
          
          if (!mappedPaymentMethod) {
            console.error('❌ Método de pagamento inválido:', formData.paymentMethod);
            toast({
              title: "❌ Erro no método de pagamento",
              description: "Método de pagamento inválido. Por favor, selecione novamente.",
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "⏳ Processando pagamento...",
            description: "Aguarde enquanto preparamos seu pagamento seguro.",
          });

          console.log('=== SENDING TO EDGE FUNCTION ===');
          console.log('Payment Method:', mappedPaymentMethod);
          console.log('Card Token:', formData.cardToken ? '***EXISTS***' : 'MISSING');
          console.log('Payment Method ID:', formData.paymentMethodId || 'MISSING');
          console.log('Issuer ID:', formData.issuerId || 'MISSING');

          // Obter token atualizado para autenticação
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (!currentSession) {
            throw new Error('Sessão expirada. Por favor, faça login novamente.');
          }

          const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
            'create-payment-preference',
            {
              headers: {
                Authorization: `Bearer ${currentSession.access_token}`
              },
              body: {
                items: cartItems,
                orderId: order.id,
                customerInfo: {
                  name: customerName,
                  phone: customerPhone,
                  email: session.user.email,
                  identificationType: formData.identificationType,
                  identificationNumber: formData.identificationNumber,
                },
                paymentMethod: mappedPaymentMethod,
                totalAmount: totalPrice,
                cardToken: formData.cardToken,
                paymentMethodId: formData.paymentMethodId,
                issuerId: formData.issuerId,
              }
            }
          );

          if (paymentError) {
            console.error('❌ Erro ao criar preferência de pagamento:', paymentError);
            
            // Verificar se é erro de valor mínimo
            const errorMessage = paymentError.message || '';
            const isMinimumAmountError = errorMessage.includes('valor mínimo') || 
                                        errorMessage.includes('MINIMUM_AMOUNT_ERROR') ||
                                        (paymentData?.code === 'MINIMUM_AMOUNT_ERROR');
            
            try {
              await supabase
                .from('orders')
                .update({ status: 'new' })
                .eq('id', order.id);
            } catch (revertError) {
              console.error('❌ Falha ao reverter status do pedido:', revertError);
            }
            
            toast({
              title: isMinimumAmountError ? "⚠️ Valor abaixo do mínimo" : "❌ Erro ao processar pagamento online",
              description: isMinimumAmountError 
                ? "O valor mínimo para pagamento com cartão é R$ 1,00. Por favor, adicione mais itens ao carrinho ou escolha 'Pagar na Entrega'."
                : "Não foi possível conectar ao sistema de pagamento. Tente 'Pagar na Entrega' ou entre em contato conosco.",
              variant: "destructive",
              duration: 10000,
            });
            return;
          }

          // Tratamento diferenciado: PIX vs Cartão Transparente vs Cartão Redirect
          if (paymentData.paymentType === 'card') {
            // Cartão Transparente: Pagamento processado imediatamente
            setIsCheckoutFormOpen(false);
            setIsCartModalOpen(false);
            setCartItems([]);

            if (paymentData.approved) {
              toast({
                title: "✅ Pagamento aprovado!",
                description: "Seu pedido foi confirmado com sucesso.",
                duration: 3000,
              });

              setTimeout(() => {
                navigate(`/pedido-confirmado?order_id=${order.id}`);
              }, 1000);
            } else {
              // Pagamento rejeitado ou pendente
              const statusMessages: Record<string, string> = {
                'cc_rejected_insufficient_amount': 'Saldo insuficiente no cartão',
                'cc_rejected_bad_filled_security_code': 'Código de segurança inválido',
                'cc_rejected_bad_filled_date': 'Data de validade inválida',
                'cc_rejected_bad_filled_other': 'Dados do cartão inválidos',
                'cc_rejected_call_for_authorize': 'Entre em contato com seu banco para autorizar',
                'cc_rejected_card_disabled': 'Cartão desabilitado',
                'cc_rejected_duplicated_payment': 'Pagamento duplicado',
                'cc_rejected_high_risk': 'Pagamento rejeitado por segurança',
              };

              const errorMessage = statusMessages[paymentData.statusDetail] || 'Pagamento não aprovado';

              toast({
                title: "❌ Pagamento não processado",
                description: errorMessage,
                variant: "destructive",
                duration: 8000,
              });

              // Reverter pedido para permitir nova tentativa
              await supabase
                .from('orders')
                .update({ status: 'new' })
                .eq('id', order.id);
            }
            
          } else if (paymentData.paymentType === 'pix') {
            // PIX: Mostrar QR Code
            if (!paymentData.qrCode) {
              try {
                await supabase
                  .from('orders')
                  .update({ status: 'new' })
                  .eq('id', order.id);
              } catch (revertError) {
                console.error('❌ Falha ao reverter status do pedido:', revertError);
              }
              
              toast({
                title: "❌ Erro ao gerar QR Code PIX",
                description: "Não foi possível gerar o código PIX. Tente novamente ou escolha outra forma de pagamento.",
                variant: "destructive",
                duration: 8000,
              });
              return;
            }

            // Fechar modais e abrir modal do PIX
            setIsCheckoutFormOpen(false);
            setIsCartModalOpen(false);
            
            setPixPaymentData({
              qrCode: paymentData.qrCode,
              qrCodeBase64: paymentData.qrCodeBase64,
              totalAmount: totalPrice,
              paymentId: String(paymentData.paymentId),
              orderId: order.id,
            });

            toast({
              title: "✅ QR Code PIX gerado!",
              description: "Escaneie o QR Code para pagar.",
              duration: 3000,
            });
          }
          
          return;
        } catch (mpError) {
          console.error('❌ EXCEÇÃO ao processar Mercado Pago:', mpError);
          
          try {
            await supabase
              .from('orders')
              .update({ status: 'new' })
              .eq('id', order.id);
          } catch (revertError) {
            console.error('❌ Falha ao reverter status do pedido:', revertError);
          }
          
          const errorMessage = mpError instanceof Error ? mpError.message : 'Erro desconhecido';
          
          toast({
            title: "❌ Erro inesperado no pagamento",
            description: `${errorMessage}. Por favor, escolha 'Pagar na Entrega' ou entre em contato.`,
            variant: "destructive",
            duration: 10000,
          });
          
          return;
        }
      }

      if (!isMercadoPago) {
        try {
          const { error: clickupError } = await supabase.functions.invoke('create-clickup-task', {
            body: {
              orderId: order.id.substring(0, 8),
              customerName: customerName,
              customerPhone: customerPhone,
              items: cartItems.map(item => ({
                name: item.name,
                quantity: item.cartQuantity,
                price: item.price
              })),
              address: formData.address,
              neighborhood: formData.neighborhood,
              city: formData.city,
              phone: customerPhone,
              total: totalPrice,
              paymentMethod: formData.paymentMethod,
            }
          });

          if (clickupError) {
            console.error('Error sending to ClickUp:', clickupError);
          }
        } catch (clickupError) {
          console.error('Error sending to ClickUp:', clickupError);
        }
      }

      if (!isMercadoPago) {
        const itemsList = cartItems.map(item => 
          `${item.cartQuantity}x ${item.name} - R$ ${(item.price * item.cartQuantity).toFixed(2).replace('.', ',')}`
        ).join('\n');
        
        const customerInfo = `*Dados do Cliente:*\nNome: ${formData.name}\nTelefone: ${formData.phone}\nEndereço: ${formData.address}, ${formData.neighborhood}, ${formData.city}\nPagamento: ${formData.paymentMethod}`;
        
        const message = encodeURIComponent(
          `Olá! Gostaria de fazer um pedido:\n\n*Produtos:*\n${itemsList}\n\n*Total: R$ ${totalPrice.toFixed(2).replace('.', ',')}*\n\n${customerInfo}\n\nPor favor, confirmem o pedido e informem o tempo de entrega. Obrigado!`
        );
        
        window.open(`https://wa.me/5524992502881?text=${message}`, '_blank');
        setIsCheckoutFormOpen(false);
        setCartItems([]);
        
        toast({
          title: "Pedido registrado!",
          description: "Seu pedido foi criado e enviado para processamento.",
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Erro ao criar pedido",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemsCount={getTotalItemsInCart()}
        onCartClick={handleCartClick}
      />
      
      <main className="py-20">
        <ProductsSection onAddToCart={handleAddToCart} />
      </main>
      
      <Footer />
      
      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
      
      <CheckoutForm
        isOpen={isCheckoutFormOpen}
        onClose={() => setIsCheckoutFormOpen(false)}
        cartItems={cartItems}
        onSubmit={handleCheckoutSubmit}
      />

      <PixPaymentModal
        isOpen={!!pixPaymentData}
        onClose={() => setPixPaymentData(null)}
        qrCode={pixPaymentData?.qrCode || ''}
        qrCodeBase64={pixPaymentData?.qrCodeBase64}
        totalAmount={pixPaymentData?.totalAmount || 0}
        paymentId={pixPaymentData?.paymentId || ''}
        orderId={pixPaymentData?.orderId || ''}
      />
    </div>
  );
};

export default Products;
